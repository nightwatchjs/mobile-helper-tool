import colors from 'ansi-colors';
import cliProgress from 'cli-progress';
import download from 'download';
import fs from 'fs';
import path from 'path';
import {execSync} from 'child_process';

import {copySync, rmDirSync, symbols} from '../../utils';
import {Platform} from './interfaces';
import DOWNLOADS from './downloads.json';

export const getBinaryNameForOS = (platform: Platform, binaryName: string) => {
  if (platform !== 'windows') {
    return binaryName;
  }

  if (['sdkmanager', 'avdmanager'].includes(binaryName)) {
    return `${binaryName}.bat`;
  }

  if (!path.extname(binaryName)) {
    return `${binaryName}.exe`;
  }

  return binaryName;
};

export const downloadAndSetupAndroidSdk = async (sdkRoot: string, platform: Platform) => {
  // make sure `cmdline-tools` folder is not present already
  const cmdline_tools = path.join(sdkRoot, 'cmdline-tools');
  const temp_cmdline_tools1 = path.join(sdkRoot, 'cmdline-tools-temp1');
  const temp_cmdline_tools2 = path.join(sdkRoot, 'cmdline-tools-temp2');

  const cmdline_tools_latest = path.join(sdkRoot, 'cmdline-tools', 'latest');
  const cmdline_tools_old = path.join(sdkRoot, 'cmdline-tools', 'old');
  const cmdline_tools_new = path.join(sdkRoot, 'cmdline-tools', 'new');

  // remove directors that might conflict later, if present somehow
  rmDirSync(temp_cmdline_tools1);
  rmDirSync(temp_cmdline_tools2);
  rmDirSync(cmdline_tools_old);
  rmDirSync(cmdline_tools_new);

  // if cmdline-tools are already present, shift to temp folder temporarily.
  // also, rename 'latest' to 'old'.
  if (fs.existsSync(cmdline_tools)) {
    if (fs.existsSync(cmdline_tools_latest)) {
      fs.renameSync(cmdline_tools_latest, cmdline_tools_old);
    }
    fs.renameSync(cmdline_tools, temp_cmdline_tools1);
  }

  // download android sdk (cmdline-tools)
  const progressBar = new cliProgress.Bar({
    format: ' [{bar}] {percentage}% | ETA: {eta}s'
  }, cliProgress.Presets.shades_classic);

  const stream = download(DOWNLOADS.sdk[platform], sdkRoot, {
    extract: true
  });
  progressBar.start(100, 0);

  await stream.on('downloadProgress', function(progress) {
    progressBar.update(progress.percent*100);
  });
  progressBar.stop();

  // re-arrange files
  fs.renameSync(cmdline_tools, temp_cmdline_tools2);
  fs.mkdirSync(cmdline_tools_new, {recursive: true});
  fs.renameSync(temp_cmdline_tools2, cmdline_tools_new);
  // bring back older cmdline-tools, if present
  if (fs.existsSync(temp_cmdline_tools1)) {
    copySync(temp_cmdline_tools1, cmdline_tools);
    rmDirSync(temp_cmdline_tools1);
  }

  console.log('cmdline-tools downloaded successfully!\n');

  // update sdkmanager
  console.log('Updating cmdline-tools to the latest version...');
  const binaryFullName = getBinaryNameForOS(platform, 'sdkmanager');
  let cmd: string;

  if (platform === 'windows') {
    cmd = `${binaryFullName} "cmdline-tools;latest"`;
  } else {
    cmd = `./${binaryFullName} "cmdline-tools;latest"`;
  }

  try {
    execSync(cmd, {
      input: 'y',
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: path.join(cmdline_tools_new, 'bin')
    });

    rmDirSync(cmdline_tools_new);
    console.log(`${colors.green('Success!')} Updated cmdline-tools to the latest version.\n`);
  } catch {
    console.log('Failed! Falling back to the current downloaded version.');
    fs.renameSync(cmdline_tools_new, cmdline_tools_latest);
  }
};

export const installPackagesUsingSdkManager = (
  sdkManagerLocation: string,
  platform: Platform,
  packages: string[]
) => {
  const sdkManagerFullName = path.basename(sdkManagerLocation);
  const sdkManagerDirPath = path.dirname(sdkManagerLocation);
  let result = true;

  for (const packageName of packages) {
    console.log(`Installing ${packageName}...`);
    let cmd: string;

    if (platform === 'windows') {
      cmd = `${sdkManagerFullName} "${packageName}"`;
    } else {
      cmd = `./${sdkManagerFullName} "${packageName}"`;
    }

    try {
      execSync(cmd, {
        input: 'y',
        stdio: ['pipe', 'inherit', 'inherit'],
        cwd: sdkManagerDirPath
      });

      console.log(`${colors.green('Success!')} ${packageName} installed successfully.\n`);
    } catch {
      console.log(
        `${colors.red(symbols().fail)} Failed to run ${colors.cyan(cmd)} inside '${sdkManagerDirPath}'\n`
      );
      result = false;
    }
  }

  return result;
};
