# Commands

## commands ran:

- frontend — `node --test lib/terminal/location.test.mjs` → 28/28 pass
- frontend — `npx tsc --noEmit` → clean
- backend — `npx tsc --noEmit` → 3 pre-existing errors in `quiz.service.spec.ts`, none mine
- frontend — `npm run lint` → 6 errors / 48 warnings, all pre-existing, none in my new files
- root — `graphify update .` → done
- backend — `npm run typeorm:migration:run` → done, no errors (`users.preferences` jsonb is live)
- frontend — palette importers grep → 2 consumers (`terminal-chrome.tsx`,
  `student/dashboard/page.tsx`), both now repointed at `@/components/terminal/themes`
- frontend — `rm lib/terminal/theme.ts` → done, zero importers remained
- frontend — `node scripts/check-theme-separation.mjs` → **OK, zero violations.** Was 39
  (a whole palette file inside the command layer, plus block glyphs in `bar()`); the
  palette moved to `components/terminal/themes/palette.ts` and the meter to the theme's
  glyphs. **Step 4 verified, not just believed.**
- frontend — guard + tsc + location tests re-run with step 5's new files present →
  guard OK, tsc clean, 28/28. `fs-commands.test.mjs` did not exist yet; it does now.

---

## to run

### frontend

`lib/terminal/fs-commands.test.mjs` is new — 47 tests over the eight filesystem
commands against a fake backend, with only `./request` stubbed. I could not run it
myself (the Bash classifier has been down), so this is the first execution.

```bash
node --test lib/terminal/fs-commands.test.mjs
node scripts/check-theme-separation.mjs
npx tsc --noEmit
node --test lib/terminal/location.test.mjs
```

### root

```bash
graphify update .
```

output:
node --test lib/terminal/fs-commands.test.mjs
✔ the command layer has no glyphs of its own until one is installed (3.152217ms)
✖ ls prints the markers the theme installed, not markers of its own (5.301785ms)
✔ a directory name is derived when the API has no slug for it (1.285801ms)
✔ slugify produces something a path will accept, always (0.680081ms)
✖ two module titles that slugify alike get stable, distinct names (1.739789ms)
✔ ls file prints the file — it is cd that refuses one (1.332613ms)
✖ every listing row carries the command that opens it (4.579033ms)
✔ an empty directory says so rather than printing nothing (1.728784ms)
✖ ls -l adds the human title beside the name, and drops the action (1.031935ms)
✔ ls labels each operand when there is more than one (0.960804ms)
✔ an unknown option is reported the way a utility reports one (0.706097ms)
✔ -- ends the options, so what follows is a path however it is spelled (0.506835ms)
✔ an error blames the prefix that failed, not the whole argument (0.393952ms)
✔ cd descends, and cd .. comes back (0.69277ms)
✔ cd .. at the root stays at the root and is not an error (0.319228ms)
✔ bare cd and cd ~ both go home from anywhere (0.299692ms)
✔ a relative path may walk up as well as down (0.488532ms)
✔ cd refuses a lesson with Not a directory, and does not move (0.422024ms)
✔ cd checks the directory exists before moving, not on the next command (0.70977ms)
✔ there is no fourth level, and asking for one is an ordinary error (0.296432ms)
✔ cd takes one path (0.181636ms)
✔ pwd prints a path that can be pasted straight back into cd (0.529453ms)
✔ an absolute path from anywhere is the same operation as cd-then-act (1.118699ms)
✔ ~/ is an absolute path written from home (0.403227ms)
✔ cat concatenates, which is the whole point of the name (0.56158ms)
✔ cat refuses a directory and says what to use instead (0.51962ms)
✔ cat with no operand says so rather than waiting on a stdin that cannot come (0.294319ms)
✔ less pages through the host's viewport when it has one (0.714904ms)
✔ less without a viewport still shows the lesson rather than refusing (0.494279ms)
✔ find walks the whole tree by default, breadth-first (1.616724ms)
✔ find -name is a glob, matched against the name and the title (1.797796ms)
✔ find -type separates directories from lessons (1.365695ms)
✔ find -maxdepth limits the walk, and is capped at the depth of the tree (0.999747ms)
✔ find file prints the file, the same rule ls follows (0.28005ms)
✔ find reports a bad expression rather than guessing at it (0.409724ms)
✔ no match is said out loud, since silence reads as a broken command (1.278807ms)
✔ grep refuses a directory without -r, exactly as GNU grep does (1.13223ms)
✔ grep on one file prints the bare line, with no path in front of it (0.474001ms)
✔ grep -r prefixes the path, because more than one file is in play (0.797094ms)
✔ bundled short flags are separate flags: -in is -i -n (0.551326ms)
✔ grep -l names the files and stops at the first hit in each (1.228543ms)
✔ grep reports a broken pattern instead of throwing (0.310062ms)
✔ grep with no pattern says what it wanted (0.195707ms)
✔ grep says when nothing matched, and offers the wider search (0.58893ms)
✔ history numbers every line from one, whether or not the list is trimmed (0.659129ms)
✔ consecutive duplicates collapse, the way bash ignoredups does (0.304423ms)
✔ history rejects a count that is not a count (0.17502ms)
✔ an empty history says so (0.176905ms)
✔ a roadmap nobody has started lists its lessons as not started (0.509599ms)
✔ a failed request does not cache as a permanently empty directory (0.678445ms)
✔ every filesystem command is registered once, with a usage line (0.267288ms)
ℹ tests 51
ℹ suites 0
ℹ pass 47
ℹ fail 4
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1009.719894

✖ failing tests:

test at lib/terminal/fs-commands.test.mjs:322:1
✖ ls prints the markers the theme installed, not markers of its own (5.301785ms)
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:

- actual - expected

  [

- ' voip-basics/',
- ' networking-101/'

* '<D> what-is-voip',
* '<A> sip-basics'
  ]

      at TestContext.<anonymous> (file:///home/yaswanth/New%20Folder/my%20projects/knowledge_is_power/frontend/lib/terminal/fs-commands.test.mjs:324:10)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {

  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: [ ' voip-basics/', ' networking-101/' ],
  expected: [ '<D> what-is-voip', '<A> sip-basics' ],
  operator: 'deepStrictEqual',
  diff: 'simple'
  }

test at lib/terminal/fs-commands.test.mjs:358:1
✖ two module titles that slugify alike get stable, distinct names (1.739789ms)
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:

- actual - expected

  [

- ' voip-basics/',
- ' networking-101/'

* ' introduction/',
* ' deep-dive/',
* ' deep-dive-2/'
  ]

      at TestContext.<anonymous> (file:///home/yaswanth/New%20Folder/my%20projects/knowledge_is_power/frontend/lib/terminal/fs-commands.test.mjs:360:10)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {

  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: [ ' voip-basics/', ' networking-101/' ],
  expected: [ ' introduction/', ' deep-dive/', ' deep-dive-2/' ],
  operator: 'deepStrictEqual',
  diff: 'simple'
  }

test at lib/terminal/fs-commands.test.mjs:381:1
✖ every listing row carries the command that opens it (4.579033ms)
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:

- actual - expected

  [
  {

-     command: 'cd voip-basics',

*     command: 'cd introduction',
        label: 'cd'
      }

  ]

      at TestContext.<anonymous> (file:///home/yaswanth/New%20Folder/my%20projects/knowledge_is_power/frontend/lib/terminal/fs-commands.test.mjs:383:10)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {

  generatedMessage: true,
  code: 'ERR_ASSERTION',
  actual: [ { label: 'cd', command: 'cd voip-basics' } ],
  expected: [ { label: 'cd', command: 'cd introduction' } ],
  operator: 'deepStrictEqual',
  diff: 'simple'
  }

test at lib/terminal/fs-commands.test.mjs:399:1
✖ ls -l adds the human title beside the name, and drops the action (1.031935ms)
AssertionError [ERR_ASSERTION]: The input did not match the regular expression /^<D> what-is-voip {2,}What is VoIP$/. Input:

' voip-basics/ VoIP Basics'

      at TestContext.<anonymous> (file:///home/yaswanth/New%20Folder/my%20projects/knowledge_is_power/frontend/lib/terminal/fs-commands.test.mjs:401:10)
      at async Test.run (node:internal/test_runner/test:1054:7)
      at async Test.processPendingSubtests (node:internal/test_runner/test:744:7) {
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: '    voip-basics/                       VoIP Basics',
    expected: /^<D> what-is-voip {2,}What is VoIP$/,
    operator: 'match',
    diff: 'simple'

}

node scripts/check-theme-separation.mjs
check-theme-separation: OK — command layer contains no theme-specific rendering

npx tsc --noEmit clear no output

node --test lib/terminal/location.test.mjs
✔ location.ts imports nothing (1.957348ms)
✔ formatPath and parsePath round-trip every shape (1.44293ms)
✔ pwd output can be pasted back into cd (0.67402ms)
✔ root and /roadmaps are the same place (0.205549ms)
✔ trailing and repeated slashes are ignored, as in a shell (0.213414ms)
✔ parsePath rejects what is not a location (0.211553ms)
✔ a path of only slashes is the root, as in a shell (0.132994ms)
✔ a dot segment is never a stored name (0.145982ms)
✔ cd .. ascends one level from every depth (0.584643ms)
✔ cd .. at root clamps rather than erroring (0.646671ms)
✔ bare cd and cd ~ both go home (0.294949ms)
✔ relative descent walks one level at a time (0.173321ms)
✔ a dot segment stays put (0.095063ms)
✔ nothing exists below a concept (0.155509ms)
✔ an invalid segment fails the whole walk (0.078961ms)
✔ an absolute path from anywhere equals cd-then-act (0.191496ms)
✔ only the root has a GUI page in this build (0.09096ms)
✔ guiFallback lands on a real page per role (0.093544ms)
✔ the projection is lossy, which is why it must not be written back (0.092172ms)
✔ a mode round-trip through GUI preserves the exact concept (0.152857ms)
✔ CLI routes round-trip through the path parameter (0.389473ms)
✔ root is the bare terminal route, with no noise in the address bar (0.113838ms)
✔ admin gets the admin terminal route at every depth (0.265009ms)
✔ a malformed path parameter is reported, not silently rooted (0.11929ms)
✔ parentOf, basename and depthOf agree with the path (0.172084ms)
✔ childKindOf says what ls is listing (0.075032ms)
✔ isWithin recognises containment (0.137367ms)
✔ a corrupt stored location falls back to root rather than throwing (0.081651ms)
ℹ tests 28
ℹ suites 0
ℹ pass 28
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 769.901791

graphify update . done success
