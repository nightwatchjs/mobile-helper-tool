import colors from 'ansi-colors';
import axios, {AxiosResponse} from 'axios';
import cliProgress from 'cli-progress';
import download from 'download';
import fs from 'fs';
import os from 'os';
import path from 'path';
import which from 'which';

import {symbols} from '../../../utils';
import {ABI, AVAILABLE_OPTIONS, AVAILABLE_SUBCOMMANDS, DEFAULT_CHROME_VERSIONS, DEFAULT_FIREFOX_VERSION, SDK_BINARY_LOCATIONS} from '../constants';
import { Platform, SdkBinary} from '../interfaces';
import Logger from '../../../logger';
import untildify from 'untildify';

export const getAllAvailableOptions = () => {
  const mainOptions = Object.keys(AVAILABLE_OPTIONS);

  const allOptions: string[] = [];
  mainOptions.forEach((option) => allOptions.push(option, ...AVAILABLE_OPTIONS[option].alias));

  return allOptions;
};

export const getBinaryNameForOS = (platform: Platform, binaryName: string) => {
  if (platform !== 'windows') {
    return binaryName;
  }

  if (['sdkmanager', 'avdmanager', 'apksigner'].includes(binaryName)) {
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
    return DEFAULT_CHROME_VERSIONS[1];
  }
};

export const getFirefoxApkName = (version: string) => {
  return `fenix-${version}.multi.android-${ABI}.apk`;
};

export const downloadFirefoxAndroid = async (version: string) => {
  if (!version) {
    version = await getLatestVersion('firefox');
  }

  const tempdir = os.tmpdir();

  const apkName = getFirefoxApkName(version);
  if (fs.existsSync(path.join(tempdir, apkName))) {
    console.log(`  ${colors.green(symbols().ok)} APK already downloaded.`);

    return true;
  }

  const apkDownloadUrl = `https://archive.mozilla.org/pub/fenix/releases/${version}/android/fenix-${version}-android-${ABI}/${apkName}`;

  return await downloadWithProgressBar(apkDownloadUrl, tempdir);
};

export function getSdkRootFromEnv(androidHomeInGlobalEnv: boolean, rootDir: string): string {
  Logger.log('Checking the value of ANDROID_HOME environment variable...');

  const androidHome = process.env.ANDROID_HOME;
  const fromDotEnv = androidHomeInGlobalEnv ? '' : ' (taken from .env)';

  if (androidHome) {
    const androidHomeFinal = untildify(androidHome);

    const androidHomeAbsolute = path.resolve(rootDir, androidHomeFinal);
    if (androidHomeFinal !== androidHomeAbsolute) {
      Logger.log(`  ${colors.yellow('!')} ANDROID_HOME is set to '${androidHomeFinal}'${fromDotEnv} which is NOT an absolute path.`);
      Logger.log(`  ${colors.green(symbols().ok)} Considering ANDROID_HOME to be '${androidHomeAbsolute}'\n`);

      return androidHomeAbsolute;
    }

    Logger.log(`  ${colors.green(symbols().ok)} ANDROID_HOME is set to '${androidHomeFinal}'${fromDotEnv}\n`);

    return androidHomeFinal;
  }

  if (androidHome === undefined) {
    Logger.log(
      `  ${colors.red(symbols().fail)} ANDROID_HOME environment variable is NOT set!\n`
    );
  } else {
    Logger.log(
      `  ${colors.red(symbols().fail)} ANDROID_HOME is set to '${androidHome}'${fromDotEnv} which is NOT a valid path!\n`
    );
  }

  return '';
}

export function showHelp(unknownOptions: string[], unknownSubcommand?: string ) {
  if (unknownSubcommand) {
    Logger.log(colors.red(`unknown subcommand passed: ${unknownSubcommand}\n`));
  } else if (unknownOptions.length) {
    Logger.log(colors.red(`unknown option(s) passed: ${unknownOptions.join(', ')}\n`));
  }

  Logger.log(`Usage: ${colors.cyan('npx @nightwatch/mobile-helper android [options] [subcommand] [subcommand-options]')}`);
  Logger.log('  Verify if all the requirements are met to run tests on an Android device/emulator.\n');

  Logger.log(`${colors.yellow('Options:')}`);

  const switches = Object.keys(AVAILABLE_OPTIONS).reduce((acc: {[T: string]: string}, key) => {
    acc[key] = [key].concat(AVAILABLE_OPTIONS[key].alias || [])
      .map(function(sw) {
        return (sw.length > 1 ? '--' : '-') + sw;
      })
      .join(', ');

    return acc;
  }, {});

  const longest = (xs: string[]) => Math.max.apply(null, xs.map(x => x.length));

  const switchlen = longest(Object.keys(switches).map(function(s) {
    return switches[s] || '';
  }));

  const desclen = longest(Object.keys(AVAILABLE_OPTIONS).map((option) => {
    return AVAILABLE_OPTIONS[option].description;
  }));

  Object.keys(AVAILABLE_OPTIONS).forEach(key => {
    const kswitch = switches[key];
    let desc = AVAILABLE_OPTIONS[key].description;
    const spadding = new Array(Math.max(switchlen - kswitch.length + 3, 0)).join('.');
    const dpadding = new Array(Math.max(desclen - desc.length + 1, 0)).join(' ');

    if (dpadding.length > 0) {
      desc += dpadding;
    }

    const prelude = '  ' + (kswitch) + ' ' + colors.grey(spadding);

    Logger.log(prelude + ' ' + colors.grey(desc));
  });

  Logger.log(`\n${colors.yellow('Subcommands and Subcommand-Options:')}`);

  Object.keys(AVAILABLE_SUBCOMMANDS).forEach(subcommand => {
    const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];
    const subcmdOptions = subcmd.options?.map(option => `[--${option.name}]`).join(' ') || '';
    
    Logger.log(`  ${colors.cyan(subcommand)} ${subcmdOptions}`);
    Logger.log(`  ${colors.gray(subcmd.description)}`);

    if (subcmd.options && subcmd.options.length > 0) {
      const optionLongest = longest(subcmd.options.map(option => `--${option.name}`));
      subcmd.options.forEach(option => {
        const optionStr = `--${option.name}`;
        const optionPadding = new Array(Math.max(optionLongest - optionStr.length + 3, 0)).join('.');
        Logger.log(`    ${optionStr} ${colors.grey(optionPadding)} ${colors.gray(option.description)}`);
      });
    }
    Logger.log();
  });
}