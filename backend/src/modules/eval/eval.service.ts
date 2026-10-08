import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { AiPromptStatus } from '../../common/enums/ai-prompt-status.enum';
import { AiPromptVersion } from '../ai-generate/entities/ai-prompt-version.entity';
import { ConceptCompilation } from '../ai-generate/entities/concept-compilation.entity';
import { CourseTerm } from '../ai-generate/entities/course-term.entity';
import { CourseConceptEdge } from '../ai-generate/entities/course-concept-edge.entity';
import { ModuleConcept } from '../content/entities/module-concept.entity';
import { ModuleConceptPrerequisite } from '../content/entities/module-concept-prerequisite.entity';
import { McqQuestion } from '../quiz/entities/mcq-question.entity';
import { ConceptMedia } from '../ai-generate/entities/concept-media.entity';
import { canSeeConcept } from '../content/utils/visibility.util';
import { EvalRun } from './entities/eval-run.entity';
import { EvalComparison } from './entities/eval-comparison.entity';
import { EvalPromptRelease } from './entities/eval-prompt-release.entity';
import { EvalExpertReview } from './entities/eval-expert-review.entity';
import { EvalJudgeService } from './eval-judge.service';
import { EvalEvents } from './eval-events';
import {
  EvalArtifact,
  EvalContext,
  EMPTY_EVAL_CONTEXT,
  evaluateArtifact,
} from './eval-checks';
import {
  EVAL_RUBRIC,
  RUBRIC_DIMENSIONS,
  RUBRIC_VERSION,
  parseJudgeBatch,
} from './eval-rubric';
import { evidenceText, canonical, hashText, hashValue } from './eval-hash';
import {
  loadEvalGoldens,
  EvalGolden,
  goldenSetHash,
  renderGoldenInput,
  diffGolden,
  artifactFromOutput,
  STATIC_SYSTEMS,
} from './eval-goldens';
import { compareEvalRuns } from './eval-gate';
import { AiPromptRegistry } from '../ai-generate/ai-prompt-registry.service';
import { EvalLinksService } from './eval-links.service';

type Actor = Pick<User, 'id' | 'role'>;
@Injectable()
export class EvalService {
  constructor(
    @InjectRepository(EvalRun) private readonly runs: Repository<EvalRun>,
    @InjectRepository(AiPromptVersion)
    private readonly prompts: Repository<AiPromptVersion>,
    @InjectRepository(EvalComparison)
    private readonly comparisons: Repository<EvalComparison>,
    @InjectRepository(EvalPromptRelease)
    private readonly releases: Repository<EvalPromptRelease>,
    @InjectRepository(EvalExpertReview)
    private readonly reviews: Repository<EvalExpertReview>,
    @InjectRepository(ConceptCompilation)
    private readonly compilations: Repository<ConceptCompilation>,
    @InjectRepository(CourseTerm)
    private readonly terms: Repository<CourseTerm>,
    @InjectRepository(CourseConceptEdge)
    private readonly edges: Repository<CourseConceptEdge>,
    @InjectRepository(ModuleConcept)
    private readonly placements: Repository<ModuleConcept>,
    @InjectRepository(ModuleConceptPrerequisite)
    private readonly prerequisites: Repository<ModuleConceptPrerequisite>,
    @InjectRepository(McqQuestion)
    private readonly questions: Repository<McqQuestion>,
    @InjectRepository(ConceptMedia)
    private readonly media: Repository<ConceptMedia>,
    private readonly judge: EvalJudgeService,
    private readonly db: DataSource,
    private readonly events: EvalEvents,
    private readonly registry: AiPromptRegistry,
    private readonly links: EvalLinksService,
  ) {}
  private admin(actor: Actor) {
    if (actor.role !== UserRole.ADMIN)
      throw new ForbiddenException('Admin evaluation access required');
  }
  private task(task: string): asserts task is AiGenerationType {
    if (!Object.values(AiGenerationType).includes(task as AiGenerationType))
      throw new BadRequestException('Unknown prompt task');
  }
  rubric() {
    return { version: RUBRIC_VERSION, anchors: EVAL_RUBRIC };
  }
  goldens(actor: Actor, task?: string) {
    this.admin(actor);
    if (task) this.task(task);
    const rows = loadEvalGoldens();
    if (rows.length > 50)
      throw new BadRequestException(
        'Golden corpus exceeds the explicit 50-case paid-run budget; raise the bound deliberately before adding cases',
      );
    return rows.filter((r) => !task || (r.registryTask ?? r.task) === task);
  }
  private async version(task: AiGenerationType, version: string) {
    const row = await this.prompts.findOne({ where: { task, version } });
    if (!row) throw new NotFoundException('Prompt version not found');
    return row;
  }
  async createCandidate(
    task: string,
    version: string,
    template: string,
    changelog: string,
    actor: Actor,
  ) {
    this.admin(actor);
    this.task(task);
    if (
      !/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version) ||
      version.length > 32 ||
      !template.trim() ||
      template.length > 30000 ||
      !changelog.trim()
    )
      throw new BadRequestException(
        'Candidate needs a bounded semantic version, template and changelog',
      );
    if (await this.prompts.findOne({ where: { task, version } }))
      throw new ConflictException(
        'Prompt versions are immutable; create a new version',
      );
    return this.prompts.save(
      this.prompts.create({
        task,
        version,
        systemTemplate: template,
        changelog,
        status: AiPromptStatus.DRAFT,
      }),
    );
  }
  private async observeMcqs(
    artifact: EvalArtifact,
    fixture: EvalGolden,
    actor: Actor,
  ) {
    if (artifact.kind !== 'mcq_set' || !Array.isArray(artifact.mcqs)) return;
    if (artifact.mcqs.length > 10)
      throw new BadRequestException('At most ten items per eval artifact');
    const settings = this.judge.settings();
    const verifier = await this.prompts.findOne({
      where: {
        task: AiGenerationType.CONCEPT_MCQ_VERIFY,
        status: AiPromptStatus.PRODUCTION,
      },
    });
    for (const q of artifact.mcqs as Array<Record<string, any>>) {
      if (
        !q ||
        typeof q.questionText !== 'string' ||
        !Array.isArray(q.options) ||
        q.options.length > 12
      )
        continue;
      try {
        const raw = await this.judge.complete(
          actor.id,
          settings.judgeModel,
          verifier?.systemTemplate ?? STATIC_SYSTEMS.concept_mcq_verify,
          JSON.stringify({
            title: fixture.input!.title,
            content: fixture.input!.content,
            questionText: q.questionText,
            options: q.options.map((o: any) => o.optionText),
          }),
          verifier?.version ?? 'legacy-static',
          {
            temperature: 0,
            maxTokens: 800,
            responseFormat: { type: 'json_object' },
            seed: settings.seed,
          },
        );
        const v = JSON.parse(raw);
        const key = q.options.findIndex((o: any) => o.isCorrect === true);
        const indexes = v?.defensibleIndexes;
        const valid =
          v &&
          Array.isArray(indexes) &&
          indexes.every(
            (i: unknown) =>
              Number.isInteger(i) &&
              Number(i) >= 0 &&
              Number(i) < q.options.length,
          ) &&
          new Set(indexes).size === indexes.length &&
          typeof v.reason === 'string' &&
          !!v.reason.trim() &&
          typeof v.nullSetCorrect === 'boolean';
        q.verificationResult = {
          agreed:
            !!valid &&
            v.answerIndex === key &&
            indexes.length === 1 &&
            indexes[0] === key,
          final: valid ? v : null,
          provenance: {
            model: settings.judgeModel,
            promptVersion: verifier?.version ?? 'legacy-static',
            promptHash: hashText(
              verifier?.systemTemplate ?? STATIC_SYSTEMS.concept_mcq_verify,
            ),
            seed: settings.seed,
          },
        };
        q.nullSetCorrect = valid && v.nullSetCorrect;
      } catch {
        q.verificationResult = { agreed: false, final: null };
      }
    }
  }
  private async generateRuns(
    prompt: AiPromptVersion,
    mode: EvalRun['mode'],
    actor: Actor,
    fixtures: EvalGolden[],
    setHash: string,
  ) {
    const settings = this.judge.settings();
    const rows: EvalRun[] = [];
    for (const fixture of fixtures) {
      let artifact: EvalArtifact = { kind: 'structured', structured: null },
        output: unknown,
        raw: string | null = null;
      const warnings: string[] = [];
      try {
        raw = await this.judge.complete(
          actor.id,
          settings.generatorModel,
          prompt.systemTemplate,
          renderGoldenInput(fixture.task, fixture.input!),
          prompt.version,
          {
            temperature: 0,
            seed: settings.seed,
            maxTokens: 5000,
            responseFormat: {
              type: ['prose', 'lesson'].includes(fixture.format)
                ? 'text'
                : 'json_object',
            },
          },
        );
        if (raw.length > 60000) throw new Error('Oversized output');
        ({ artifact, output } = artifactFromOutput(fixture, raw));
        await this.observeMcqs(artifact, fixture, actor);
      } catch {
        warnings.push('EVAL_OUTPUT_FAILURE: provider, parse or size failure');
        raw = null;
      }
      const context = {
        ...EMPTY_EVAL_CONTEXT,
        links: await this.links.snapshot(artifact.content ?? ''),
      };
      const row = await this.runs.save(
        this.runs.create({
          task: prompt.task,
          promptVersion: prompt.version,
          promptHash: hashText(prompt.systemTemplate),
          artifactHash: hashValue(artifact),
          artifact,
          context,
          generatorModel: settings.generatorModel,
          judgeModel: null,
          judgePromptVersion: null,
          judgePromptHash: null,
          rubricVersion: RUBRIC_VERSION,
          seed: settings.seed,
          goldenId: fixture.id,
          goldenSetHash: setHash,
          mode,
          status: warnings.length ? 'failed' : 'pending',
          deterministicResult: await evaluateArtifact(artifact, context),
          judgeResult: null,
          judgeRaw: null,
          goldenDiff: diffGolden(fixture, output),
          warnings,
          source: {
            goldenId: fixture.id,
            goldenTask: fixture.task,
            rawOutput: raw,
          },
          createdById: actor.id,
        }),
      );
      rows.push(row);
    }
    return rows;
  }
  private async judgeRuns(rows: EvalRun[], actor: Actor) {
    const size = this.judge.settings().batchSize;
    const pending = rows.filter((r) => r.status === 'pending');
    for (let i = 0; i < pending.length; i += size)
      await this.judge.judgeBatch(pending.slice(i, i + size), actor.id);
    for (const row of rows)
      this.events.emit({
        type: 'eval_recorded',
        artifactId: row.id,
        version: row.promptVersion,
      });
    return rows;
  }
  async shadow(task: string, version: string, actor: Actor) {
    this.admin(actor);
    this.task(task);
    const fixtures = this.goldens(actor, task);
    return this.judgeRuns(
      await this.generateRuns(
        await this.version(task, version),
        'shadow',
        actor,
        fixtures,
        goldenSetHash(fixtures),
      ),
      actor,
    );
  }
  async regression(actor: Actor) {
    this.admin(actor);
    const report: Array<Record<string, unknown>> = [];
    this.goldens(actor);
    for (const task of Object.values(AiGenerationType)) {
      const effective = await this.registry.resolveSystem(
        task,
        STATIC_SYSTEMS[task],
      );
      const production = await this.prompts.findOne({
        where: { task, version: effective.version },
      });
      if (!production) {
        report.push({
          task,
          passed: false,
          differences: ['No production prompt version'],
        });
        continue;
      }
      const fixtures = this.goldens(actor, task),
        rows = await this.judgeRuns(
          await this.generateRuns(
            production,
            'baseline',
            actor,
            fixtures,
            goldenSetHash(fixtures),
          ),
          actor,
        );
      report.push({
        task,
        version: production.version,
        passed:
          rows.length > 0 &&
          rows.every(
            (r) =>
              r.status === 'completed' &&
              r.deterministicResult.passed &&
              r.goldenDiff?.passed,
          ),
        runs: rows.map((r) => ({
          id: r.id,
          goldenId: r.goldenId,
          status: r.status,
          checks: r.deterministicResult.checks,
          differences: r.goldenDiff?.differences,
          judge: r.judgeResult,
          warnings: r.warnings,
        })),
      });
    }
    return { passed: report.every((r) => r.passed), tasks: report };
  }
  async compare(
    task: string,
    baselineVersion: string,
    candidateVersion: string,
    actor: Actor,
  ) {
    this.admin(actor);
    this.task(task);
    if (baselineVersion === candidateVersion)
      throw new BadRequestException('Compare distinct prompt versions');
    const baseline = await this.version(task, baselineVersion),
      candidate = await this.version(task, candidateVersion);
    const fixtures = this.goldens(actor, task),
      setHash = goldenSetHash(fixtures);
    const a = await this.generateRuns(
        baseline,
        'baseline',
        actor,
        fixtures,
        setHash,
      ),
      b = await this.generateRuns(
        candidate,
        'candidate',
        actor,
        fixtures,
        setHash,
      );
    await this.judgeRuns([...a, ...b], actor);
    return this.comparisons.save(
      this.comparisons.create({
        task,
        baselinePromptId: baseline.id,
        candidatePromptId: candidate.id,
        goldenSetHash: setHash,
        baselineRunIds: a.map((r) => r.id),
        candidateRunIds: b.map((r) => r.id),
        result: compareEvalRuns(
          a,
          b,
          fixtures.map((f) => f.id),
          setHash,
        ),
      }),
    );
  }
  async promote(id: string, actor: Actor) {
    this.admin(actor);
    return this.db.transaction(async (manager) => {
      const comparison = await manager.findOne(EvalComparison, {
        where: { id },
      });
      if (!comparison) throw new NotFoundException('Comparison not found');
      this.task(comparison.task);
      const baseline = await manager.findOne(AiPromptVersion, {
        where: { id: comparison.baselinePromptId },
        lock: { mode: 'pessimistic_write' },
      });
      const candidate = await manager.findOne(AiPromptVersion, {
        where: { id: comparison.candidatePromptId },
        lock: { mode: 'pessimistic_write' },
      });
      if (
        !baseline ||
        !candidate ||
        baseline.status !== AiPromptStatus.PRODUCTION ||
        baseline.task !== comparison.task ||
        candidate.task !== comparison.task ||
        candidate.status === AiPromptStatus.ARCHIVED
      )
        throw new ConflictException(
          'Baseline/candidate changed since comparison',
        );
      const currentBaseline = await manager.findOne(AiPromptVersion, {
        where: { task: comparison.task, status: AiPromptStatus.PRODUCTION },
        order: { createdAt: 'DESC' },
      });
      if (currentBaseline?.id !== baseline.id)
        throw new ConflictException(
          'Current production baseline changed; compare again',
        );
      const fixtures = this.goldens(actor, comparison.task),
        setHash = goldenSetHash(fixtures);
      const a = await manager.find(EvalRun, {
          where: { id: In(comparison.baselineRunIds) },
        }),
        b = await manager.find(EvalRun, {
          where: { id: In(comparison.candidateRunIds) },
        });
      if (comparison.goldenSetHash !== setHash)
        throw new ConflictException('Golden corpus changed; compare again');
      for (const [rows, prompt, mode] of [
        [a, baseline, 'baseline'],
        [b, candidate, 'candidate'],
      ] as const) {
        for (const run of rows) {
          if (
            run.task !== prompt.task ||
            run.promptVersion !== prompt.version ||
            run.promptHash !== hashText(prompt.systemTemplate) ||
            run.mode !== mode ||
            run.artifactHash !== hashValue(run.artifact)
          )
            throw new ConflictException(
              'Eval input or prompt fingerprint changed; compare again',
            );
          const fixture = fixtures.find((f) => f.id === run.goldenId);
          if (
            !fixture ||
            typeof run.source?.rawOutput !== 'string' ||
            !run.judgeRaw
          )
            throw new ConflictException('Incomplete auditable run');
          run.deterministicResult = await evaluateArtifact(
            run.artifact,
            run.context,
          );
          run.goldenDiff = diffGolden(
            fixture,
            artifactFromOutput(fixture, run.source.rawOutput).output,
          );
          try {
            run.judgeResult = parseJudgeBatch(
              run.judgeRaw,
              new Map(
                [...a, ...b]
                  .filter((r) => r.judgeRaw === run.judgeRaw)
                  .map((r) => [r.id, evidenceText(r.artifact)]),
              ),
            ).get(run.id)!;
          } catch {
            throw new ConflictException('Invalid stored judge evidence');
          }
        }
      }
      const result = compareEvalRuns(
        a,
        b,
        fixtures.map((f) => f.id),
        setHash,
      );
      if (!result.passed)
        throw new ConflictException({
          message: 'Promotion blocked by protected metrics',
          ...result,
        });
      await manager.update(
        EvalPromptRelease,
        { task: comparison.task, status: 'approved' },
        { status: 'revoked' },
      );
      return manager.save(
        EvalPromptRelease,
        manager.create(EvalPromptRelease, {
          task: comparison.task,
          baselinePromptId: baseline.id,
          candidatePromptId: candidate.id,
          comparisonId: id,
          baselineHash: hashText(baseline.systemTemplate),
          candidateHash: hashText(candidate.systemTemplate),
          goldenSetHash: setHash,
          status: 'approved',
          approvedById: actor.id,
        }),
      );
    });
  }
  async rollback(task: string, actor: Actor) {
    this.admin(actor);
    this.task(task);
    await this.releases.update(
      { task, status: 'approved' },
      { status: 'revoked' },
    );
    return { task, baselineRestored: true };
  }
  async run(id: string, actor: Actor) {
    this.admin(actor);
    const row = await this.runs.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Eval run not found');
    return row;
  }
  async evaluateCompilation(id: string, actor: Actor, useJudge = false) {
    this.admin(actor);
    const compilation = await this.compilations.findOne({
      where: { id },
      relations: ['concept'],
    });
    const concept = compilation?.concept;
    if (
      !compilation ||
      !concept?.isAiGenerated ||
      !compilation.roadmapId ||
      !canSeeConcept(concept, [], actor)
    )
      throw new NotFoundException('Generated compilation not available');
    const roadmapId = compilation.roadmapId;
    const placements = await this.placements.find({
      where: { module: { roadmapId } },
      relations: ['concept'],
    });
    const terms = await this.terms.find({ where: { roadmapId } }),
      edges = await this.edges.find({ where: { roadmapId } });
    const prerequisites = placements.length
      ? await this.prerequisites.find({
          where: { moduleConceptId: In(placements.map((p) => p.id)) },
        })
      : [];
    const conceptByPlacement = new Map(
      placements.map((p) => [p.id, p.conceptId]),
    );
    const context: EvalContext = {
      concepts: [
        ...new Map(
          placements
            .filter((p) => p.concept)
            .map((p) => [
              p.conceptId,
              { id: p.conceptId, title: p.concept.title },
            ]),
        ).values(),
      ],
      terms: terms.flatMap((t) => [t.term, ...t.aliases]),
      placements: placements.map((p) => p.conceptId),
      links: await this.links.snapshot(concept.content),
      edges: [
        ...edges.map((e) => ({
          from: e.fromConceptId,
          to: e.toConceptId,
          type: e.type,
        })),
        ...prerequisites.map((p) => ({
          from:
            conceptByPlacement.get(p.prerequisiteModuleConceptId) ??
            p.prerequisiteModuleConceptId,
          to: conceptByPlacement.get(p.moduleConceptId)!,
          type: 'prerequisite',
        })),
      ],
    };
    const questions = await this.questions.find({
      where: { conceptId: concept.id },
      relations: ['options'],
      order: { orderIndex: 'ASC' },
    });
    const media = await this.media.find({ where: { conceptId: concept.id } });
    const refs = compilation.stages.find((s) => s.stage === 'outline')
      ?.detail as
      | Pick<EvalArtifact, 'conceptRefs' | 'termRefs' | 'callbackRefs'>
      | undefined;
    const artifact: EvalArtifact = {
      kind: 'compilation',
      content: concept.content,
      conceptRefs: refs?.conceptRefs,
      termRefs: refs?.termRefs,
      callbackRefs: refs?.callbackRefs,
      mcqs: questions
        .filter((q) => !q.retiredAt)
        .map((q) => ({
          questionText: q.questionText,
          bloomLevel: q.bloomLevel,
          intendedDifficulty: q.intendedDifficulty,
          correctRationale: q.correctRationale,
          verificationResult: q.verificationResult,
          options: q.options
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((o) => ({
              optionText: o.optionText,
              isCorrect: o.isCorrect,
              misconception: o.misconception,
              distractorRationale: o.distractorRationale,
            })),
        })),
      diagrams: media
        .filter((m) => m.kind === 'diagram')
        .map((m) => ({
          id: String(m.payload.diagramId),
          kind: String(m.payload.kind),
          mermaid: String(m.payload.mermaid),
        })),
      stages: compilation.stages.map((s) => ({
        stage: String(s.stage),
        ok: s.ok === true,
      })),
    };
    const provenance = compilation.stages.find((s) => s.stage === 'publish')
      ?.detail as
      | {
          promptVersion?: string;
          promptHash?: string;
          model?: string;
          task?: AiGenerationType;
          artifactHash?: string;
        }
      | undefined;
    const version = provenance?.promptVersion ?? 'unknown-historical';
    const changed =
      !!provenance?.artifactHash &&
      provenance.artifactHash !== hashText(concept.content);
    const row = await this.runs.save(
      this.runs.create({
        task: provenance?.task ?? AiGenerationType.CONCEPT_DRAFT,
        promptVersion: version,
        promptHash: provenance?.promptHash ?? 'unknown-historical',
        artifactHash: hashValue(artifact),
        artifact,
        context,
        generatorModel: provenance?.model ?? 'unknown-historical',
        judgeModel: null,
        judgePromptVersion: null,
        judgePromptHash: null,
        rubricVersion: RUBRIC_VERSION,
        seed: null,
        judgeSeed: null,
        goldenId: null,
        goldenSetHash: null,
        mode: 'saved_artifact',
        status: useJudge ? 'pending' : 'completed',
        deterministicResult: await evaluateArtifact(artifact, context),
        judgeResult: null,
        judgeRaw: null,
        goldenDiff: null,
        warnings: [
          ...(version === 'unknown-historical'
            ? ['HISTORICAL_PROVENANCE_UNKNOWN: no model/version/seed inferred']
            : []),
          ...(changed ? ['ARTIFACT_EDITED_AFTER_COMPILATION'] : []),
        ],
        source: {
          compilationId: id,
          conceptId: concept.id,
          questionVersions: questions.map((q) => ({
            id: q.id,
            version: q.versionNumber,
          })),
        },
        createdById: actor.id,
      }),
    );
    if (useJudge) await this.judge.judgeBatch([row], actor.id);
    this.events.emit({ type: 'eval_recorded', artifactId: row.id, version });
    return row;
  }
  async expertReview(
    runId: string,
    actor: Actor,
    input: {
      decision: EvalExpertReview['decision'];
      reasonCodes: string[];
      reason: string;
      scores: EvalExpertReview['scores'];
      proposedRevision?: string;
    },
  ) {
    this.admin(actor);
    const run = await this.run(runId, actor);
    if (run.rubricVersion !== RUBRIC_VERSION)
      throw new ConflictException(
        'Score with the rubric version recorded on the run',
      );
    if (
      !['approve', 'edit', 'reject'].includes(input.decision) ||
      !Array.isArray(input.reasonCodes) ||
      input.reasonCodes.some(
        (code) =>
          ![
            'accuracy',
            'clarity',
            'pedagogy',
            'difficulty',
            'evidence',
            'other',
          ].includes(code),
      ) ||
      !input.reason?.trim() ||
      input.reason.length > 2000 ||
      !input.scores ||
      Object.keys(input.scores).length !== RUBRIC_DIMENSIONS.length ||
      RUBRIC_DIMENSIONS.some(
        (d) =>
          !Number.isInteger(input.scores[d]) ||
          input.scores[d] < 1 ||
          input.scores[d] > 5,
      ) ||
      (input.decision !== 'approve' && !input.reasonCodes.length) ||
      (input.decision === 'edit' && !input.proposedRevision?.trim())
    )
      throw new BadRequestException(
        'Expert review needs anchored integer scores, reasons and an edit revision when applicable',
      );
    return this.reviews.save(
      this.reviews.create({
        evalRunId: runId,
        expertId: actor.id,
        decision: input.decision,
        reasonCodes: input.reasonCodes,
        reason: input.reason,
        scores: input.scores,
        proposedRevision: input.proposedRevision ?? null,
        rubricVersion: RUBRIC_VERSION,
      }),
    );
  }
}
