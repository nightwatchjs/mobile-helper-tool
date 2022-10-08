import inquirer from 'inquirer';

export const SETUP_CONFIG_QUES: inquirer.QuestionCollection = [
  {
    type: 'list',
    name: 'mode',
    message: 'Where do you want to run the tests?',
    choices: [
      {name: 'On real iOS device', value: 'real'},
      {name: 'On an iOS Simulator', value: 'simulator'},
      {name: 'Both', value: 'both'}
    ]
  }
];
