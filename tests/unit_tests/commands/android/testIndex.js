const assert = require('assert');
const {config: dotenv_config} = require('dotenv');
const fs = require('fs');
const mockery = require('mockery');
const path = require('path');
const os = require('os');

describe('test showHelp', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  it('shows error for unknown options', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    androidSetup.showHelp(['random']);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('unknown option(s) passed: random'), true);
  });

  it('does not shows error for no unknown options', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    androidSetup.showHelp([]);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('unknown option(s) passed:'), false);
  });
});

describe('test checkJavaInstallation', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  it('returns true if command executed successfully', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    const commandsExecuted = [];
    mockery.registerMock('child_process', {
      execSync(command) {
        commandsExecuted.push(command);
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    const result = androidSetup.checkJavaInstallation();

    assert.strictEqual(result, true);
    assert.strictEqual(commandsExecuted[0], 'java -version');

    const output = consoleOutput.toString();
    assert.strictEqual(output, '');
  });

  it('returns false if command execution failed', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    const commandsExecuted = [];
    mockery.registerMock('child_process', {
      execSync(command) {
        commandsExecuted.push(command);
        throw Error();
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    const result = androidSetup.checkJavaInstallation();

    assert.strictEqual(result, false);
    assert.strictEqual(commandsExecuted[0], 'java -version');

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('Java Development Kit is required'), true);
    assert.strictEqual(output.includes('Make sure Java is installed by running java -version'), true);
  });
});

describe('test getSdkRootFromEnv', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();

    // Remove contents of .env file
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), '');
  });

  test('when ANDROID_HOME defined in env with absolute path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    const origAndroidHome = process.env.ANDROID_HOME;

    const platformAndroidHome = (process.platform === 'win32')
      ? 'C:\\users\\nightwatch\\android_sdk' : '/Users/nightwatch/android_sdk';

    process.env.ANDROID_HOME = platformAndroidHome;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    const result = androidSetup.getSdkRootFromEnv();

    assert.strictEqual(result, platformAndroidHome);
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes(`ANDROID_HOME is set to '${platformAndroidHome}'\n`), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME defined in env with ~ path and in .env with absolute path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    let dotenvRead = false;
    mockery.registerMock('dotenv', {
      config: (options) => {
        if (fs.existsSync(options.path)) {
          dotenvRead = true;
        }

        dotenv_config(options);
      }
    });

    const platformAbsoluteAndroidHome = (process.platform === 'win32')
      ? 'C:\\users\\nightwatch\\android_sdk' : '/Users/nightwatch/android_sdk';

    // set absolute ANDROID_HOME to .env file.
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), `ANDROID_HOME=${platformAbsoluteAndroidHome}`);

    // set ~ ANDROID_HOME to process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    const androidHome = path.join('~', 'android_sdk_tilde');
    process.env.ANDROID_HOME = androidHome;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    const result = androidSetup.getSdkRootFromEnv();

    const absoluteAndroidHome = path.join(os.homedir(), 'android_sdk_tilde');
    assert.strictEqual(result, absoluteAndroidHome);
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, true);
    assert.strictEqual(dotenvRead, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes(`ANDROID_HOME is set to '${absoluteAndroidHome}'\n`), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME defined in env with relative path and in .env with absolute path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    let dotenvRead = false;
    mockery.registerMock('dotenv', {
      config: (options) => {
        if (fs.existsSync(options.path)) {
          dotenvRead = true;
        }

        dotenv_config(options);
      }
    });

    const platformAbsoluteAndroidHome = (process.platform === 'win32')
      ? 'C:\\users\\nightwatch\\android_sdk' : '/Users/nightwatch/android_sdk';

    // set absolute ANDROID_HOME to .env file.
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), `ANDROID_HOME=${platformAbsoluteAndroidHome}`);

    // set relative ANDROID_HOME to process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    const androidHome = 'android_sdk_relative';
    process.env.ANDROID_HOME = androidHome;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    const result = androidSetup.getSdkRootFromEnv();

    const absoluteAndroidHome = path.join(rootDir, androidHome);
    // ANDROID_HOME should be absolute now.
    assert.strictEqual(result, absoluteAndroidHome);
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, true);
    assert.strictEqual(dotenvRead, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes(`ANDROID_HOME is set to '${androidHome}' which is NOT`), true);
    assert.strictEqual(output.includes(`Considering ANDROID_HOME to be '${absoluteAndroidHome}'\n`), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME defined in env with empty path and in .env with absolute path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    let dotenvRead = false;
    mockery.registerMock('dotenv', {
      config: (options) => {
        if (fs.existsSync(options.path)) {
          dotenvRead = true;
        }

        dotenv_config(options);
      }
    });

    const platformAbsoluteAndroidHome = (process.platform === 'win32')
      ? 'C:\\users\\nightwatch\\android_sdk' : '/Users/nightwatch/android_sdk';

    // set absolute ANDROID_HOME to .env file.
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), `ANDROID_HOME=${platformAbsoluteAndroidHome}`);

    // set ANDROID_HOME='' to process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    const androidHome = '';
    process.env.ANDROID_HOME = androidHome;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    const result = androidSetup.getSdkRootFromEnv();

    assert.strictEqual(result, '');
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, true);
    assert.strictEqual(dotenvRead, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('ANDROID_HOME is set to \'\' which is NOT a valid path!'), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME not defined in env and not defined in .env as well', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    // set ANDROID_HOME to undefined in process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    delete process.env.ANDROID_HOME;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    const result = androidSetup.getSdkRootFromEnv();

    assert.strictEqual(result, '');
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, false);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('ANDROID_HOME environment variable is NOT set!'), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME not defined in env but defined in .env with absolute path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    let dotenvRead = false;
    mockery.registerMock('dotenv', {
      config: (options) => {
        if (fs.existsSync(options.path)) {
          dotenvRead = true;
        }

        dotenv_config(options);
      }
    });

    const platformAbsoluteAndroidHome = (process.platform === 'win32')
      ? 'C:\\users\\nightwatch\\android_sdk' : '/Users/nightwatch/android_sdk';

    // set absolute ANDROID_HOME to .env file.
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), `ANDROID_HOME=${platformAbsoluteAndroidHome}`);

    // set ANDROID_HOME to undefined in process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    delete process.env.ANDROID_HOME;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    const result = androidSetup.getSdkRootFromEnv();

    assert.strictEqual(result, platformAbsoluteAndroidHome);
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, false);
    assert.strictEqual(dotenvRead, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes(`ANDROID_HOME is set to '${platformAbsoluteAndroidHome}' (taken from .env)`), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME not defined in env but defined in .env with relative path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    let dotenvRead = false;
    mockery.registerMock('dotenv', {
      config: (options) => {
        if (fs.existsSync(options.path)) {
          dotenvRead = true;
        }

        dotenv_config(options);
      }
    });

    const androidHome = 'android_sdk_relative';

    // set relative ANDROID_HOME to .env file.
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), `ANDROID_HOME=${androidHome}`);

    // set ANDROID_HOME to undefined in process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    delete process.env.ANDROID_HOME;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    const result = androidSetup.getSdkRootFromEnv();

    const absoluteAndroidHome = path.join(rootDir, androidHome);
    assert.strictEqual(result, absoluteAndroidHome);
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, false);
    assert.strictEqual(dotenvRead, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes(`ANDROID_HOME is set to '${androidHome}' (taken from .env) which is NOT`), true);
    assert.strictEqual(output.includes(`Considering ANDROID_HOME to be '${absoluteAndroidHome}'\n`), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });

  test('when ANDROID_HOME not defined in env but defined in .env with empty path', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    let dotenvRead = false;
    mockery.registerMock('dotenv', {
      config: (options) => {
        if (fs.existsSync(options.path)) {
          dotenvRead = true;
        }

        dotenv_config(options);
      }
    });

    const androidHome = '';

    // set relative ANDROID_HOME to .env file.
    const rootDir = path.join(__dirname, 'fixtures');
    fs.writeFileSync(path.join(rootDir, '.env'), `ANDROID_HOME=${androidHome}`);

    // set ANDROID_HOME to undefined in process.env
    const origAndroidHome = process.env.ANDROID_HOME;
    delete process.env.ANDROID_HOME;

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    const result = androidSetup.getSdkRootFromEnv();

    assert.strictEqual(result, '');
    assert.strictEqual(androidSetup.otherInfo.androidHomeInGlobalEnv, false);
    assert.strictEqual(dotenvRead, true);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('ANDROID_HOME is set to \'\' (taken from .env) which is NOT a valid path!'), true);

    process.env.ANDROID_HOME = origAndroidHome;
  });
});

describe('test getSdkRootFromUser', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  test('when ANDROID_HOME defined in env (empty string) and user passed absolute path', async () => {
    const platformAbsoluteAndroidHome = (process.platform === 'win32')
      ? 'C:\\users\\nightwatch\\android_sdk' : '/Users/nightwatch/android_sdk';

    let filterFn;
    mockery.registerMock('inquirer', {
      prompt: async (questions) => {
        filterFn = questions[0].filter;

        return {sdkRoot: filterFn(platformAbsoluteAndroidHome)};
      }
    });

    const rootDir = path.join(__dirname, 'fixtures');

    let appendFileSyncCalled = false;
    mockery.registerMock('node:fs', {
      appendFileSync(path, content) {
        appendFileSyncCalled = true;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    androidSetup.otherInfo.androidHomeInGlobalEnv = true;
    const sdkRoot = await androidSetup.getSdkRootFromUser();

    // sdkRoot is absolute
    assert.strictEqual(sdkRoot, path.resolve(sdkRoot));
    // sdkRoot is as expected
    assert.strictEqual(sdkRoot, platformAbsoluteAndroidHome);

    assert.strictEqual(appendFileSyncCalled, false);
  });

  test('when ANDROID_HOME defined in env (empty string) and user passed ~ path', async () => {
    const androidHome = path.join('~', 'android_sdk_tilde');

    let filterFn;
    mockery.registerMock('inquirer', {
      prompt: async (questions) => {
        filterFn = questions[0].filter;

        return {sdkRoot: filterFn(androidHome)};
      }
    });

    const rootDir = path.join(__dirname, 'fixtures');

    let appendFileSyncCalled = false;
    mockery.registerMock('node:fs', {
      appendFileSync(path, content) {
        appendFileSyncCalled = true;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    androidSetup.otherInfo.androidHomeInGlobalEnv = true;
    const sdkRoot = await androidSetup.getSdkRootFromUser();

    // sdkRoot is absolute
    assert.strictEqual(sdkRoot, path.resolve(sdkRoot));
    // sdkRoot is as expected
    assert.strictEqual(sdkRoot, path.join(os.homedir(), 'android_sdk_tilde'));

    assert.strictEqual(appendFileSyncCalled, false);
  });

  test('when ANDROID_HOME not defined in env and user passed relative path', async () => {
    const androidHome = 'android_sdk_relative';

    let filterFn;
    mockery.registerMock('inquirer', {
      prompt: async (questions) => {
        filterFn = questions[0].filter;

        return {sdkRoot: filterFn(androidHome)};
      }
    });

    const rootDir = path.join(__dirname, 'fixtures');

    let appendFileSyncCalled = false;
    let envPath;
    let envContent;
    mockery.registerMock('node:fs', {
      appendFileSync(path, content) {
        appendFileSyncCalled = true;
        envPath = path;
        envContent = content;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
    androidSetup.otherInfo.androidHomeInGlobalEnv = false;
    const sdkRoot = await androidSetup.getSdkRootFromUser();

    // sdkRoot is absolute
    assert.strictEqual(sdkRoot, path.resolve(sdkRoot));
    // sdkRoot is as expected
    const androidHomeAbsolute = path.join(rootDir, androidHome);
    assert.strictEqual(sdkRoot, androidHomeAbsolute);

    assert.strictEqual(appendFileSyncCalled, true);
    assert.strictEqual(envPath, path.join(rootDir, '.env'));
    assert.strictEqual(envContent.includes(`ANDROID_HOME=${androidHomeAbsolute}\n`), true);
  });
});

describe('test getConfigFromOptions', function() {
  test('with different arguments', () => {
    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let configs = androidSetup.getConfigFromOptions({mode: 'emulator,real', browsers: 'chrome,firefox,something'});
    assert.deepStrictEqual(configs, {mode: 'both', browsers: 'both'});

    configs = androidSetup.getConfigFromOptions({mode: 'emulator,both', browsers: 'chrome,both'});
    assert.deepStrictEqual(configs, {mode: 'both', browsers: 'both'});

    configs = androidSetup.getConfigFromOptions({mode: 'something', browsers: 'chrome,firefox,none'});
    assert.deepStrictEqual(configs, {browsers: 'none'});

    configs = androidSetup.getConfigFromOptions({mode: 'emulator', browsers: 'something'});
    assert.deepStrictEqual(configs, {mode: 'emulator'});

    configs = androidSetup.getConfigFromOptions({mode: 'real', browsers: 'firefox'});
    assert.deepStrictEqual(configs, {mode: 'real', browsers: 'firefox'});

    configs = androidSetup.getConfigFromOptions({mode: ['real', 'emulator'], browsers: ['chrome', 'something']});
    assert.deepStrictEqual(configs, {mode: 'both', browsers: 'chrome'});
  });
});

describe('test getSetupConfigs', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  test('options being passed to prompt correctly', async () => {
    mockery.registerMock('inquirer', {
      async prompt(questions, answers) {
        return answers;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let configs = await androidSetup.getSetupConfigs({mode: 'emulator,real', browsers: 'chrome,firefox,something'});
    assert.deepStrictEqual(configs, {mode: 'both', browsers: 'both'});

    configs = await androidSetup.getSetupConfigs({mode: 'something', browsers: 'chrome,firefox,none'});
    assert.deepStrictEqual(configs, {browsers: 'none'});
  });
});

describe('test checkBinariesPresent', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  test('missing binaries reported correctly', () => {
    mockery.registerMock('./utils/common', {
      getBinaryLocation: (sdkRoot, platform, binaryName) => {
        if (binaryName === 'emulator') {
          return '';
        }

        return 'some/location';
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let missingBinaries = androidSetup.checkBinariesPresent(['adb', 'emulator', 'avdmanager']);
    assert.deepStrictEqual(missingBinaries, ['emulator']);
  });
});

describe('test checkBinariesWorking', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  test('non-working binaries reported correctly', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../logger',
      class {
        static log(...msgs) {
          consoleOutput.push(...msgs);
        }
      }
    );

    const colorFn = (arg) => arg;
    mockery.registerMock('ansi-colors', {
      green: colorFn,
      yellow: colorFn,
      magenta: colorFn,
      cyan: colorFn,
      red: colorFn,
      grey: colorFn
    });

    mockery.registerMock('./utils/common', {
      getBinaryLocation: (sdkRoot, platform, binaryName) => {
        if (binaryName === 'sdkmanager') {
          return '';
        }

        return 'some/location';
      }
    });

    const commandsExecuted = [];
    mockery.registerMock('./utils/sdk', {
      execBinarySync: (binaryPath, binaryName, platform, cmd) => {
        commandsExecuted.push(binaryName + ' ' + cmd);

        if (binaryName === 'avdmanager') {
          return null;
        }

        return 'some stdout';
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let missingBinaries = androidSetup.checkBinariesWorking(['adb', 'emulator', 'avdmanager', 'sdkmanager']);
    assert.deepStrictEqual(missingBinaries, ['avdmanager', 'sdkmanager']);
    assert.deepStrictEqual(commandsExecuted, ['adb --version', 'emulator -version', 'avdmanager list avd']);

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('sdkmanager binary not found.'), true);
  });
});
