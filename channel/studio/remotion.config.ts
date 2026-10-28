import fs from 'node:fs';
import path from 'node:path';
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');

// GAMERULE: use a pre-installed headless Chromium when there is one (REMOTION_BROWSER, or the cloud container's
// Playwright copy) instead of letting Remotion download its own.
const pw = '/opt/pw-browsers';
const browser = process.env.REMOTION_BROWSER || (fs.existsSync(pw) ? fs.readdirSync(pw)
  .filter((d) => d.startsWith('chromium_headless_shell-'))
  .map((d) => path.join(pw, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell'))
  .find((p) => fs.existsSync(p)) : undefined);
if (browser) Config.setBrowserExecutable(browser);
