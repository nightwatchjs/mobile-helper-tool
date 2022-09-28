export const symbols = () => {
  let ok = String.fromCharCode(10004);
  let fail = String.fromCharCode(10006);

  if (process.platform === 'win32') {
    ok = '\u221A';
    fail = '\u00D7';
  }

  return {
    ok: ok,
    fail: fail
  };
};

export const getPlatformName = (platform = process.platform) => {
  if (platform === 'win32') {
    return 'windows';
  } else if (platform === 'darwin') {
    return 'mac';
  }

  return 'linux';
};
