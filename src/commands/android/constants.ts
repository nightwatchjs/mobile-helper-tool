import inquirer from 'inquirer';
import path from 'path';

import {BinaryLocationInterface} from './interfaces';

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

export const SDK_BINARY_LOCATIONS: BinaryLocationInterface = {
  sdkmanager: path.join('cmdline-tools', 'latest', 'bin'),
  adb: 'platform-tools'
};
