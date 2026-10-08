import { AiPromptRegistry } from '../ai-generate/ai-prompt-registry.service';
import { AiGenerationType } from '../../common/enums/ai-generation-type.enum';
import { hashText } from './eval-hash';
import { loadEvalGoldens, goldenSetHash } from './eval-goldens';
const task = AiGenerationType.CONCEPT_CONTENT;
function setup(
  flag: string | undefined = 'true',
  selection = '{"concept_content":"2.0.0"}',
) {
  const baseline: any = {
    id: 'p1',
    task,
    version: '1.0.0',
    status: 'production',
    systemTemplate: 'BASELINE',
  };
  const candidate: any = {
    id: 'p2',
    task,
    version: '2.0.0',
    status: 'draft',
    systemTemplate: 'CANDIDATE',
  };
  const config: any = {
    get: (key: string) =>
      (
        ({
          EVAL_PROMPT_SELECTION_ENABLED: flag,
          EVAL_PROMPT_VERSIONS: selection,
        }) as any
      )[key],
  };
  const repo: any = {
    findOne: jest.fn(async ({ where }: any) =>
      where.status ? baseline : candidate,
    ),
  };
  const approval: any = {
    status: 'approved',
    baselineHash: hashText('BASELINE'),
    candidateHash: hashText('CANDIDATE'),
    goldenSetHash: goldenSetHash(
      loadEvalGoldens().filter((f) => (f.registryTask ?? f.task) === task),
    ),
  };
  const releases: any = {
    findOne: jest.fn(async () =>
      approval.status === 'approved' ? approval : null,
    ),
  };
  return {
    registry: new AiPromptRegistry(repo, config, releases),
    repo,
    releases,
    approval,
    baseline,
    candidate,
  };
}
describe('eval config prompt selection/instant rollback', () => {
  test.each([undefined, 'false', '1', 'TRUE'])(
    'flag %s preserves baseline and makes no approval queries',
    async (flag) => {
      const h = setup(flag === undefined ? '' : flag);
      expect(
        (await h.registry.resolveSystem(task, 'legacy')).systemTemplate,
      ).toBe('BASELINE');
      expect(h.releases.findOne).not.toHaveBeenCalled();
    },
  );
  test('only approved candidate serves, revocation immediately restores baseline', async () => {
    const h = setup();
    expect((await h.registry.resolveSystem(task, 'legacy')).version).toBe(
      '2.0.0',
    );
    h.approval.status = 'revoked';
    expect((await h.registry.resolveSystem(task, 'legacy')).version).toBe(
      '1.0.0',
    );
  });
  test('prompt/corpus hashes and archived candidate protect stale approvals', async () => {
    for (const mutate of [
      (h: any) => (h.candidate.systemTemplate = 'changed'),
      (h: any) => (h.approval.goldenSetHash = 'stale'),
      (h: any) => (h.candidate.status = 'archived'),
    ]) {
      const h = setup();
      mutate(h);
      expect((await h.registry.resolveSystem(task, 'legacy')).version).toBe(
        '1.0.0',
      );
    }
  });
  test('invalid config fails closed without changing generation', async () => {
    for (const selection of [
      'notjson',
      '[]',
      '{"unknown":"2"}',
      '{"concept_content":2}',
    ])
      expect(
        (await setup('true', selection).registry.resolveSystem(task, 'legacy'))
          .systemTemplate,
      ).toBe('BASELINE');
  });
});
