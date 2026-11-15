// Entry point for `npm run validate:curriculum`. Validates this repository's production
// curriculum and exits with status 0 when it is valid, or 1 with diagnostics when it is not.
// An optional argument names another repository root to validate with the same rules; the
// tests use it with disposable synthetic repositories. `--strict-translations` selects release
// mode for localization overlays: reviewed translations whose English source changed fail.
import { registerHooks } from 'node:module';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LoadIssue } from './load-curriculum.js';

// The validators import each other as `./name.js`, the form TypeScript and Vitest resolve to
// the `.ts` sources. Node's built-in type stripping does not remap extensions, so this
// process-local hook does it for relative imports made from this directory only. It writes
// no files and changes no validator.
const scriptsURL = new URL('./', import.meta.url).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    const local = context.parentURL?.startsWith(scriptsURL) === true && /^\.\/[^/]+\.js$/.test(specifier);
    return nextResolve(local ? specifier.replace(/\.js$/, '.ts') : specifier, context);
  },
});

function fail(stage: string, lines: string[]): void {
  console.error(`Curriculum validation failed at the ${stage} stage:`);
  for (const line of lines) console.error(`- ${line}`);
  process.exitCode = 1;
}

const loadLine = ({ code, message }: LoadIssue): string => `[${code}]: ${message}`;

async function main(): Promise<void> {
  // The schema belongs to the repository that contains these scripts.
  const toolRoot = fileURLToPath(new URL('..', import.meta.url));
  const args = process.argv.slice(2);
  const strictTranslations = args.includes('--strict-translations');
  const unknownFlags = args.filter((arg) => arg.startsWith('--') && arg !== '--strict-translations');
  if (unknownFlags.length > 0) {
    return fail('arguments', [`Unknown option ${unknownFlags.join(', ')}. The only option is --strict-translations.`]);
  }
  const rootArgument = args.find((arg) => !arg.startsWith('--'));
  const rootDir = rootArgument === undefined ? toolRoot : resolvePath(rootArgument);

  // The structural validator reads and compiles the schema as soon as it is imported. Check
  // the curriculum layout and the schema file first, so that a missing or symbolic-link
  // curriculum/ is reported as a diagnostic and nothing is ever read through it.
  // The loader imports only Node built-ins and reads nothing when it is imported.
  const { checkSchemaSource, loadCurriculum } = await import('./load-curriculum.js');
  const loaded = loadCurriculum(rootDir);
  if (!loaded.ok) return fail('load', loaded.errors.map(loadLine));
  const schemaIssues = checkSchemaSource(toolRoot);
  if (schemaIssues.length > 0) return fail('load', schemaIssues.map(loadLine));

  // Imported dynamically, after the hook is registered and the checks above have passed.
  let validators: typeof import('./validate-curriculum-repository.js');
  try {
    validators = await import('./validate-curriculum-repository.js');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return fail('load', [
      `[VALIDATOR_INIT_FAILED]: The validators could not be initialized: ${reason}. `
      + 'If this names a schema keyword or value, correct curriculum/schema/curriculum.schema.json; '
      + 'otherwise confirm that dependencies are installed with npm ci.',
    ]);
  }

  const result = validators.validateCurriculumRepository(rootDir, validators.PREREQUISITE_CLOSED_TRACK_IDS, { strictTranslations });
  if (result.valid) {
    const { summary } = result;
    console.log(`Curriculum ${summary.curriculumVersion} is valid.`);
    console.log(`Competencies (${summary.competencyIds.length}): ${summary.competencyIds.join(', ')}`);
    for (const track of summary.tracks) {
      console.log(`Track "${track.id}" (${track.competencyIds.length}): ${track.competencyIds.join(', ')}`);
    }
    console.log(
      `Checked ${summary.markdownFiles} Markdown files and ${summary.internalLinks} internal links. `
      + `${summary.externalLinks} external links were not fetched.`,
    );
    if (result.localization !== undefined) {
      const { summary: coverage, warnings } = result.localization;
      console.log(`Localization (${coverage.mode} mode):`);
      for (const entry of coverage.locales) {
        const text = (label: string, c: typeof entry.competencies): string =>
          `${label} ${c.publishable} publishable, ${c.draft} draft, ${c.outdated} outdated, ${c.missing} missing`;
        console.log(`- ${entry.locale}: ${text('competencies', entry.competencies)}; ${text('tracks', entry.tracks)}; ${text('modules', entry.modules)}`);
      }
      // Warnings are diagnostics, not results: they go to standard error and do not change the status.
      for (const warning of warnings) console.error(`- [${warning.code}] ${warning.file}: ${warning.message}`);
    }
    return;
  }
  if (result.stage === 'localization') {
    for (const warning of result.warnings) console.error(`- [${warning.code}] ${warning.file}: ${warning.message}`);
    return fail('localization', result.errors.map(({ code, file, message }) => `[${code}] ${file}: ${message}`));
  }
  if (result.stage === 'load') return fail('load', result.errors.map(loadLine));

  // Map a catalog JSON Pointer such as /competencies/1/title back to the file that supplied it.
  const { sources } = result;
  const sourceOf = (pointer: string): string => {
    const [, collection, index] = pointer.split('/');
    const file = collection === 'manifest' ? sources.manifest
      : collection === 'competencies' || collection === 'tracks'
        ? sources[collection][Number(index)]
        : undefined;
    return file === undefined ? '' : ` (${file})`;
  };
  fail(result.stage, result.errors.map((error) => {
    const label = 'code' in error ? error.code : error.keyword;
    const pointer = 'path' in error ? error.path : undefined;
    const location = pointer === undefined ? '' : ` ${pointer === '' ? '/' : pointer}${sourceOf(pointer)}`;
    return `[${label}]${location}: ${error.message}`;
  }));
}

await main();
