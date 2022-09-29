import path from 'path';

export const getBinaryNameForOS = (platform: string, binaryName: string) => {
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
