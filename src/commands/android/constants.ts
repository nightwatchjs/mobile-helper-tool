import inquirer from 'inquirer';
import path from 'path';

import {SdkBinary} from './interfaces';
import {getAbiForOS} from './utils/common';

export const NIGHTWATCH_AVD = 'nightwatch-android-11';

export const SETUP_CONFIG_QUES: inquirer.QuestionCollection = [
  {
    type: 'list',
    name: 'mode',
    message: 'Where do you want to run the tests?',
    choices: [
      {name: 'On real Android device', value: 'real'},
      {name: 'On an Android Emulator', value: 'emulator'},
      {name: 'Both', value: 'both'}
    ]
  },
  {
    type: 'list',
    name: 'browsers',
    message: '[Emulator] Which browser(s) should we set up on the Emulator?',
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
  [NIGHTWATCH_AVD]: `system-images;android-30;google_apis;${getAbiForOS()}`
};
