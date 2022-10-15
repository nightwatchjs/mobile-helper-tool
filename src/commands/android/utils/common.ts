import colors from 'ansi-colors';
import axios, {AxiosResponse} from 'axios';
import {exec} from 'child_process';
import cliProgress from 'cli-progress';
import download from 'download';
import fs from 'fs';
import os from 'os';
import path from 'path';
import which from 'which';

import {symbols} from '../../../utils';
import {DEFAULT_CHROME_VERSION, DEFAULT_FIREFOX_VERSION, NIGHTWATCH_AVD, SDK_BINARY_LOCATIONS} from '../constants';
import {Platform, SdkBinary} from '../interfaces';

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

export const getBinaryLocation = (sdkRoot: string, platform: Platform, binaryName: SdkBinary, suppressOutput = false) => {
  const failLocations: string[] = [];

  const binaryFullName = getBinaryNameForOS(platform, binaryName);

  const pathToBinary = path.join(sdkRoot, SDK_BINARY_LOCATIONS[binaryName], binaryFullName);
  if (fs.existsSync(pathToBinary)) {
    if (!suppressOutput) {
      console.log(
        `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${pathToBinary}'`
      );
    }

    return pathToBinary;
  }
  failLocations.push(pathToBinary);

  if (binaryName === 'adb') {
    // look for adb in sdkRoot (as it is a standalone binary).
    const adbPath = path.join(sdkRoot, binaryFullName);
    if (fs.existsSync(adbPath)) {
      if (!suppressOutput) {
        console.log(
          `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${adbPath}'`
        );
      }

      return adbPath;
    }
    failLocations.push(adbPath);

    // Look for adb in PATH also (runnable as `adb --version`)
    const adbLocation = which.sync(binaryFullName, {nothrow: true});
    if (adbLocation) {
      if (!suppressOutput) {
        console.log(
          `  ${colors.green(symbols().ok)} ${colors.cyan(binaryName)} binary is present at '${adbPath}' which is added in 'PATH'`
        );
      }

      return 'PATH';
    }
    failLocations.push('PATH');
  }

  if (!suppressOutput) {
    for (const location of failLocations) {
      console.log(
        `  ${colors.red(symbols().fail)} ${colors.cyan(binaryName)} binary not present at '${location}'`
      );
    }
  }

  return '';
};

export const getAbiForOS = () => {
  const arch = process.arch;

  if (arch === 'arm') {
    return 'armeabi-v7a';
  } else if (arch === 'arm64') {
    return 'arm64-v8a';
  } else if (['ia32', 'mips', 'ppc', 's390'].includes(arch)) {
    return 'x86';
  }

  return 'x86_64';
};

export const downloadWithProgressBar = async (url: string, dest: string, extract = false) => {
  const progressBar = new cliProgress.Bar({
    format: ' [{bar}] {percentage}% | ETA: {eta}s'
  }, cliProgress.Presets.shades_classic);

  try {
    const stream = download(url, dest, {
      extract
    });
    progressBar.start(100, 0);

    await stream.on('downloadProgress', function(progress) {
      progressBar.update(progress.percent*100);
    });
    progressBar.stop();

    return true;
  } catch {
    progressBar.stop();

    return false;
  }
};

export const getLatestVersion = async (browser: 'firefox' | 'chrome'): Promise<string> => {
  if (browser === 'firefox') {
    try {
      const {data}: AxiosResponse<{tag_name: string}> = await axios('https://api.github.com/repos/mozilla-mobile/fenix/releases/latest');

      return data['tag_name'].slice(1);
    } catch {
      return DEFAULT_FIREFOX_VERSION;
    }
  } else {
    return DEFAULT_CHROME_VERSION;
  }
};

export const getFirefoxApkName = (version: string) => {
  return `fenix-${version}.multi.android-${getAbiForOS()}.apk`;
};

export const downloadFirefoxAndroid = async (version: string) => {
  if (!version) {
    version = await getLatestVersion('firefox');
  }

  const tempdir = os.tmpdir();

  const apkName = getFirefoxApkName(version);
  if (fs.existsSync(path.join(tempdir, apkName))) {
    return true;
  }

  const apkDownloadUrl = `https://archive.mozilla.org/pub/fenix/releases/${version}/android/fenix-${version}-android-${getAbiForOS()}/${apkName}`;

  return await downloadWithProgressBar(apkDownloadUrl, tempdir);
};

export const launchAVD = (emuLocation: string, platform: Platform) => {
  const emuFullName = path.basename(emuLocation);
  const emuDirPath = path.dirname(emuLocation);

  console.log(`Launching emulator with ${NIGHTWATCH_AVD} AVD...\n`);
  let cmd: string;

  if (platform === 'windows') {
    cmd = `${emuFullName} @${NIGHTWATCH_AVD} -delay-adb`;
  } else {
    cmd = `./${emuFullName} @${NIGHTWATCH_AVD} -delay-adb`;
  }

  exec(cmd, {
    cwd: emuDirPath
  });
};
