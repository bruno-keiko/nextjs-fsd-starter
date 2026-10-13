import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import spawn from 'cross-spawn';

const tools = [
  { id: 'claude-code', label: 'Claude Code', context: 'CLAUDE.md' },
  { id: 'cursor', label: 'Cursor' },
  { id: 'codex', label: 'Codex' },
  { id: 'github-copilot', label: 'GitHub Copilot' },
  { id: 'gemini-cli', label: 'Gemini CLI', context: 'GEMINI.md' },
  { id: 'opencode', label: 'OpenCode' },
  { id: 'windsurf', label: 'Windsurf' },
  { id: 'universal', label: 'Other / shared guidance' },
  { id: 'none', label: 'Skip AI-tool setup' },
];

const aliases = { claude: 'claude-code', copilot: 'github-copilot', gemini: 'gemini-cli' };
const skillsPackage = 'skills@1.7.2';
const npmPackage = 'npm@10.9.9';

export function parseAiTools(value) {
  const ids = value.split(',').map(item => item.trim().toLowerCase());
  const selected = [...new Set(ids.map(id => aliases[id] || id))];
  for (const id of selected) {
    if (!tools.some(tool => tool.id === id)) {
      throw new Error(`Unknown AI tool: ${id || '(empty)'}. Choose ${tools.map(tool => tool.id).join(', ')}.`);
    }
  }
  if (selected.includes('none') && selected.length > 1) {
    throw new Error('Choose none by itself, or select the AI tools you use.');
  }
  return selected;
}

export async function chooseSetup({ include, databaseSelected, aiTools }) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return { include, aiTools: aiTools ?? ['universal'] };
  }

  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const controller = new AbortController();
  prompt.once('SIGINT', () => controller.abort());
  prompt.once('close', () => controller.abort());
  const question = message => prompt.question(message, { signal: controller.signal });
  try {
    if (!databaseSelected) {
      while (true) {
        const answer = (await question('\nInclude a local database (PGlite + Drizzle)? [y/N] ')).trim().toLowerCase();
        if (['y', 'yes'].includes(answer)) {
          include.add('db');
          break;
        }
        if (['', 'n', 'no'].includes(answer)) {
          break;
        }
        process.stdout.write('Enter yes or no.\n');
      }
    }

    if (aiTools !== undefined) {
      return { include, aiTools };
    }

    process.stdout.write('\nWhich AI coding tools will you use?\n');
    tools.forEach((tool, index) => process.stdout.write(`  ${index + 1}. ${tool.label}\n`));
    while (true) {
      const answer = (await question('Choose numbers or tool names, separated by commas [8]: ')).trim() || '8';
      const names = answer.split(',').map((item) => {
        const token = item.trim();
        return /^\d+$/.test(token) ? tools[Number(token) - 1]?.id || token : token;
      });
      try {
        return { include, aiTools: parseAiTools(names.join(',')) };
      } catch (error) {
        process.stdout.write(`${error.message}\n`);
      }
    }
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Project setup cancelled.', { cause: error });
    }
    throw error;
  } finally {
    prompt.close();
  }
}

function runProjectCommand(command, args, targetDir) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: targetDir,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${signal ? `stopped by ${signal}` : `exited with code ${code}`}.`));
      }
    });
  });
}

export async function refreshDependencyLock(targetDir) {
  const args = ['--yes', npmPackage, 'install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'];
  process.stdout.write('\nUpdating the dependency lockfile after removing database support...\n');
  try {
    // Use the same npm major as Node 22 CI; npm 11.6 drops a required optional-peer lock entry.
    await runProjectCommand('npx', args, targetDir);
  } catch (error) {
    throw new Error(`Dependency lockfile setup failed. The generated project is still available at ${targetDir}.\nRetry inside it: npx ${args.join(' ')}`, { cause: error });
  }
}

export async function installAiSkills(targetDir, selected) {
  if (selected.includes('none')) {
    return;
  }

  const skillPath = path.join(targetDir, '.agents', 'skills', 'feature-sliced-design', 'SKILL.md');
  try {
    await readFile(skillPath, 'utf8');
  } catch (error) {
    throw new Error('The template does not include the official FSD skill. Use an updated template or --ai-tool none.', { cause: error });
  }

  // Local installation writes a local-source entry; retain the reviewed upstream pin.
  const lockPath = path.join(targetDir, 'skills-lock.json');
  const pinnedLock = await readFile(lockPath, 'utf8');
  const args = ['add', './.agents/skills', '--skill', 'feature-sliced-design', '--agent', ...selected, '--copy', '--yes'];
  process.stdout.write(`\nSetting up the official FSD skill for ${selected.map(id => tools.find(tool => tool.id === id).label).join(', ')}...\n`);
  try {
    await runProjectCommand('npx', ['--yes', skillsPackage, ...args], targetDir);
  } catch (error) {
    throw new Error(`AI-tool setup failed. The generated project is still available at ${targetDir}.\nRetry inside it: npx ${skillsPackage} ${args.join(' ')}`, { cause: error });
  } finally {
    await writeFile(lockPath, pinnedLock, 'utf8');
  }

  for (const id of selected) {
    const context = tools.find(tool => tool.id === id).context;
    if (!context) {
      continue;
    }
    const contextPath = path.join(targetDir, context);
    let existing = '';
    try {
      existing = await readFile(contextPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
    if (!/^@(?:\.\/)?AGENTS\.md\s*$/m.test(existing)) {
      await writeFile(contextPath, `@AGENTS.md\n${existing ? `\n${existing}` : ''}`, 'utf8');
    }
  }
}
