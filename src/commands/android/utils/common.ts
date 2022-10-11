import cliProgress from 'cli-progress';
import download from 'download';
import path from 'path';

import {Platform} from '../interfaces';

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

  const stream = download(url, dest, {
    extract
  });
  progressBar.start(100, 0);

  await stream.on('downloadProgress', function(progress) {
    progressBar.update(progress.percent*100);
  });
  progressBar.stop();
};
