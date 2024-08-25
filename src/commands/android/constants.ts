import inquirer from 'inquirer';
import os from 'os';
import path from 'path';

import {ApiLevelNames, AvailableOptions, SdkBinary} from './interfaces';
import {AvailableSubcommands} from './subcommands/interfaces';

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
  },
  standalone: {
    alias: [],
    description: 'Do standalone setup for Android Emulator (no Nightwatch-related requirements will be downloaded).'
  }
};

export const AVAILABLE_SUBCOMMANDS: AvailableSubcommands = {
  connect: {
    description: 'Connect to a device',
    flags: [
      {
        name: 'wireless',
        description: 'Connect a real device wirelessly'
      }
    ]
  },
  list: {
    description: 'List connected devices or installed AVDs',
    flags: [{
      name: 'device',
      description: 'List connected devices (real devices and AVDs)'
    },
    {
      name: 'avd',
      description: 'List installed AVDs'
    }]
  },
  install: {
    description: 'Install APK, AVD or system image',
    flags: [
      {
        name: 'avd',
        description: 'Create an Android Virtual Device'
      },
      {
        name: 'app',
        description: 'Install an APK on the device',
        cliConfigs: [
          {
            name: 'path',
            alias: ['p'],
            description: 'Path to the APK file',
            usageHelp: 'path_to_apk'
          },
          {
            name: 'deviceId',
            alias: ['s'],
            description: 'Id of the device to install the APK',
            usageHelp: 'device_id'
          }
        ]
      },
      {
        name: 'system-image',
        description: 'Install a system image'
      }
    ]
  },
  uninstall: {
    description: 'todo item',
    flags: [
      {name: 'avd', description: 'todo item'}
    ]
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

export const APILevelNames: ApiLevelNames = {
  'android-10': 'Gingerbread (v2.3.3)',
  'android-11': 'Honeycomb (v3.0)',
  'android-12': 'Honeycomb (v3.1)',
  'android-13': 'Honeycomb (v3.2)',
  'android-14': 'Ice Cream Sandwich (v4.0)',
  'android-15': 'Ice Cream Sandwich (v4.0.3)',
  'android-16': 'Jelly Bean (v4.1)',
  'android-17': 'Jelly Bean (v4.2)',
  'android-18': 'Jelly Bean (v4.3)',
  'android-19': 'KitKat (v4.4)',
  'android-20': 'KitKat Watch (v4.4W)',
  'android-21': 'Lollipop (v5.0)',
  'android-22': 'Lollipop (v5.1)',
  'android-23': 'Marshmallow (v6.0)',
  'android-24': 'Nougat (v7.0)',
  'android-25': 'Nougat (v7.1)',
  'android-26': 'Oreo (v8.0)',
  'android-27': 'Oreo (v8.1)',
  'android-28': 'Pie (v9.0)',
  'android-29': 'Android 10',
  'android-30': 'Android 11',
  'android-31': 'Android 12',
  'android-32': 'Android 12L',
  'android-33': 'Android 13',
  'android-34': 'Android 14',
  'android-35': 'Android 15'
};

