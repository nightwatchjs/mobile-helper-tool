import colors from 'ansi-colors';
import axios, {AxiosResponse} from 'axios';
import cliProgress from 'cli-progress';
import decompress from 'decompress';
import {DownloaderHelper} from 'node-downloader-helper';
import fs from 'fs';
import os from 'os';
import path from 'path';
import which from 'which';
import fsP from 'fs/promises';

import {symbols} from '../../../utils';
import {ABI, AVAILABLE_OPTIONS, DEFAULT_CHROME_VERSIONS, DEFAULT_FIREFOX_VERSION, SDK_BINARY_LOCATIONS} from '../constants';
import {Platform, SdkBinary} from '../interfaces';

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
  const absoluteFolderPath = path.resolve(dest);

  // Check if the destination directory exists, if not, create it
  if (!fs.existsSync(absoluteFolderPath)) {
    fs.mkdirSync(absoluteFolderPath, { recursive: true });
  }

  const progressBar = new cliProgress.Bar({
    format: ' [{bar}] {percentage}% | ETA: {eta}s'
  }, cliProgress.Presets.shades_classic);

  const downloader = new DownloaderHelper(url, dest, { override: { skip: true } });

  downloader.on('start', () => progressBar.start(100, 0));
  downloader.on('progress', (stats) => {
    progressBar.update(stats.progress);
  });
 
  // Return a new promise to handle the asynchronous operation of decompressing the installed zip file.
  return new Promise((resolve, reject) => {
    downloader.on('end', async (downloadInfo) => {
      progressBar.stop();
      if (extract) {
        try {
          await decompress(downloadInfo.filePath, dest);
          // remove the zip file after extraction
          await fsP.unlink(downloadInfo.filePath);
          resolve(true);
        } catch (error) {
          console.error(`Error during decompression: ${error}`);
          reject(error);
        }
      } else {
        resolve(true);
      }
    });

    downloader.on('error', (error) => {
      progressBar.stop();
      reject(error);
    });

    downloader.start().catch((error) => {
      progressBar.stop();
      reject(error);
    });
  });
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
