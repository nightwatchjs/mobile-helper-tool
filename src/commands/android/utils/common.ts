import colors from 'ansi-colors';
import axios, {AxiosResponse} from 'axios';
import {execSync} from 'child_process';
import cliProgress from 'cli-progress';
import download from 'download';
import fs from 'fs';
import os from 'os';
import path from 'path';
import untildify from 'untildify';
import which from 'which';

import Logger from '../../../logger';
import {symbols} from '../../../utils';
import {
  ABI, AVAILABLE_OPTIONS, AVAILABLE_SUBCOMMANDS,
  DEFAULT_CHROME_VERSIONS, DEFAULT_FIREFOX_VERSION, SDK_BINARY_LOCATIONS
} from '../constants';
import {Platform, SdkBinary, Subcommand, ValuedOptions} from '../interfaces';

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

export const getSdkRootFromEnv = (cwd: string, androidHomeInGlobalEnv: boolean): string => {
  Logger.log('Checking the value of ANDROID_HOME environment variable...');

  const androidHome = process.env.ANDROID_HOME;
  const fromDotEnv = androidHomeInGlobalEnv ? '' : ' (taken from .env)';

  if (androidHome) {
    const androidHomeFinal = untildify(androidHome);

    const androidHomeAbsolute = path.resolve(cwd, androidHomeFinal);
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
};

export const checkJavaInstallation = (cwd: string): boolean => {
  try {
    execSync('java -version', {
      stdio: 'pipe',
      cwd: cwd
    });

    return true;
  } catch {
    Logger.log(`${colors.red('Error:')} Java Development Kit v9 or above is required to work with Android SDKs. Download from here:`);
    Logger.log(colors.cyan('  https://www.oracle.com/java/technologies/downloads/'), '\n');

    Logger.log(`Make sure Java is installed by running ${colors.green('java -version')} command and then re-run this tool.\n`);

    return false;
  }
};

export const getSubcommandHelp = (): string => {
  let output = '';

  output += `Usage: ${colors.cyan('npx @nightwatch/mobile-helper android subcmd [subcmd-options]')}\n`;
  output += '  The following subcommands are used for different operations on Android SDK:\n\n';
  output += `${colors.yellow('Subcommands and Subcommand-Options:')}\n`;

  Object.keys(AVAILABLE_SUBCOMMANDS).forEach(subcommand => {
    const subcmd = AVAILABLE_SUBCOMMANDS[subcommand];
    const subcmdOptions = subcmd.options?.map(option => `[--${option.name}]`).join(' ') || '';
    const subcmdValuedOptions = generateValuedFlagsString(subcmd.valuedOptions);

    // A subcommand will have boolean options to facilitate multiple workflows.
    // If a subcommand has single workflow, then it won't have boolean options but might
    // have valued options.

    // Display the subcommand name along with boolean options or valued options in the format:
    // subcommand [--option1] [--option2] ...
    // OR
    // subcommand [--valuedOption1 value] [--valuedOption2 value] ...
    output += `  ${colors.cyan(subcommand)} ${subcmdOptions} ${subcmdValuedOptions}\n`;
    output += `  ${colors.gray(subcmd.description)}\n`;

    // Display list of valued options for the subcommand along with description
    if (subcmd.valuedOptions) {
      // Generate a list of valued options with their aliases in the format:
      // --valuedOption | -v1 | -v2 ...
      const subcmdValuedOptionsWithAlias = getValuedOptionsWithAlias(subcmd.valuedOptions);

      subcmd.valuedOptions.forEach((valOption, idx) => {
        const optionPadding = generatePadding(subcmdValuedOptionsWithAlias, subcmdValuedOptionsWithAlias[idx].length);
        output += `    ${subcmdValuedOptionsWithAlias[idx]} ${colors.grey(optionPadding)} ${colors.gray(valOption.description)}\n`;
      });
    }

    // Display the list of boolean options for the subcommand along with description
    output += getSubcommandOptionsHelp(subcmd);
    output += '\n';
  });

  return output;
};

export const getSubcommandOptionsHelp = (subcmd: Subcommand): string => {
  let output = '';

  if (subcmd.options && subcmd.options.length > 0) {
    // Generate a list of options along with their valued flags in the format:
    // --option [--valuedOption1 value] [--valuedOption2 value] ...
    const optionsWithValuedFlags = subcmd.options.map((option) => {
      const valuedFlags = generateValuedFlagsString(option.valuedOptions);

      return option.name + ' ' + valuedFlags;
    });

    subcmd.options.forEach((option, idx) => {
      const optionStr = `--${optionsWithValuedFlags[idx]}`;
      const optionPadding = generatePadding(optionsWithValuedFlags, optionStr.length);

      output += `    ${optionStr} ${colors.grey(optionPadding)} ${colors.gray(option.description)}\n`;

      if (option.valuedOptions) {
        // Generate a list of valued options with their aliases in the format:
        // --valuedOption | -v1 | -v2 ...
        const valuedOptionsWithAlias = getValuedOptionsWithAlias(option.valuedOptions);

        option.valuedOptions.forEach((valOption, idx) => {
          const optionPadding = generatePadding(valuedOptionsWithAlias, valuedOptionsWithAlias[idx].length);
          output += `        ${valuedOptionsWithAlias[idx]} ${colors.grey(optionPadding)} ${colors.gray(valOption.description)}\n`;
        });
      }
    });
  }

  return output;
};

const generateValuedFlagsString = (valuedOptions: ValuedOptions[] | undefined) => {
  // Generate a string of valued flags in the format:
  // [--valuedOption1 value] [--valuedOption2 value] ...
  if (!valuedOptions) {
    return '';
  }

  let valuedFlagsStr = '';
  valuedOptions.forEach(valOption => {
    valuedFlagsStr += `[--${valOption.name} ${valOption.value}] `;
  });

  return valuedFlagsStr;
};

const generatePadding = (array: string[], length: number): string => {
  const longest = (xs: string[]) => Math.max.apply(null, xs.map(x => x.length));
  const padding = new Array(Math.max(longest(array) - length + 3, 0)).join('.');

  return padding;
};

const getValuedOptionsWithAlias = (valuedOptions: ValuedOptions[]): string[] => {
  const valuedOptionsWithAlias = valuedOptions.map(valOption => {
    const optionAlias = valOption.alias.map(alias => `-${alias}`).join(' |');

    return `--${valOption.name}` + (optionAlias ? ` | ${optionAlias}` : '');
  });

  return valuedOptionsWithAlias;
};

