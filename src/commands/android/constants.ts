import inquirer from 'inquirer';
import path from 'path';
import os from 'os';

import {AvailableOptions, SdkBinary} from './interfaces';

export const AVAILABLE_OPTIONS: AvailableOptions = {
  help: {
    alias: ['h'],
    description: 'Help for android command.'
  },
  setup: {
    alias: ['install', 'i'],
    description: 'Automatically setup all the missing requirements.'
  },
  mode: {
    alias: ['m'],
    description: 'Verify/setup requirements for real-device or emulator. Available args: "real", "emulator", "both"'
  },
  browsers: {
    alias: ['browser', 'b'],
    description: 'Browsers to setup on Android emulator. Available args: "chrome", "firefox", "both", "none"'
  },
  appium: {
    alias: [],
    description: 'Make sure the final setup works with Appium out-of-the-box.'
  }
};

export const NIGHTWATCH_AVD = 'nightwatch-android-11';
export const DEFAULT_FIREFOX_VERSION = '105.1.0';
export const DEFAULT_CHROME_VERSIONS = ['83', '91'];

export const ABI = (() => {
  const arch = process.arch;

  if (arch === 'arm') {
    return 'armeabi-v7a';
  } else if (arch === 'arm64') {
    return 'arm64-v8a';
  } else if (['ia32', 'mips', 'ppc', 's390'].includes(arch)) {
    return 'x86';
  }

  // Handle case when Apple M1's arch is switched to x64.
  if (arch === 'x64' && os.cpus()[0].model.includes('Apple')) {
    return 'arm64-v8a';
  }

  return 'x86_64';
})();

export const SETUP_CONFIG_QUES: inquirer.QuestionCollection = [
  {
    type: 'list',
    name: 'mode',
    message: 'Select target device(s):',
    choices: [
      {name: 'Real Android Device', value: 'real'},
      {name: 'Android Emulator', value: 'emulator'},
      {name: 'Both', value: 'both'}
    ]
  },
  {
    type: 'list',
    name: 'browsers',
    message: '[Emulator] Select browser(s) to set up on Emulator:',
    choices: [
      {name: 'Google Chrome', value: 'chrome'},
      {name: 'Mozilla Firefox', value: 'firefox'},
      {name: 'Both', value: 'both'},
      {name: 'None', value: 'none'}
    ],
    when: (answers) => ['emulator', 'both'].includes(answers.mode)
  }
];

export const SDK_BINARY_LOCATIONS: Record<SdkBinary, string> = {
  sdkmanager: path.join('cmdline-tools', 'latest', 'bin'),
  avdmanager: path.join('cmdline-tools', 'latest', 'bin'),
  adb: 'platform-tools',
  emulator: 'emulator'
};

export const BINARY_TO_PACKAGE_NAME: Record<SdkBinary | typeof NIGHTWATCH_AVD, string> = {
  sdkmanager: 'cmdline-tools;latest',
  avdmanager: 'cmdline-tools;latest',
  adb: 'platform-tools',
  emulator: 'emulator',
  [NIGHTWATCH_AVD]: `system-images;android-30;google_apis;${ABI}`
};
