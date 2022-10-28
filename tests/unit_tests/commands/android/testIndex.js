const assert = require('assert');
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

describe('test verifyAvdPresent', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  it('returns false when avd binary location not found', () => {
    mockery.registerMock('./utils/common', {
      getBinaryLocation: () => {
        return '';
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let avdPresent = androidSetup.verifyAvdPresent();
    assert.strictEqual(avdPresent, false);
  });

  it('returns false when avd is not already present', () => {
    mockery.registerMock('./utils/common', {
      getBinaryLocation: () => {
        return 'some/location';
      }
    });

    mockery.registerMock('./utils/sdk', {
      execBinarySync: () => {
        return 'something not avd';
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let avdPresent = androidSetup.verifyAvdPresent();
    assert.strictEqual(avdPresent, false);
  });

  it('returns false when avd command face error (returns null)', () => {
    mockery.registerMock('./utils/common', {
      getBinaryLocation: () => {
        return 'some/location';
      }
    });

    mockery.registerMock('./utils/sdk', {
      execBinarySync: () => {
        return null;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let avdPresent = androidSetup.verifyAvdPresent();
    assert.strictEqual(avdPresent, false);
  });

  it('returns true when avd is already present', () => {
    mockery.registerMock('./utils/common', {
      getBinaryLocation: () => {
        return 'some/location';
      }
    });

    mockery.registerMock('./utils/sdk', {
      execBinarySync: () => {
        return `something not avd
        nightwatch-android-11
        Android Virtual Devices could not be loaded
        something not avd`;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let avdPresent = androidSetup.verifyAvdPresent();
    assert.strictEqual(avdPresent, true);
  });

  it('returns false when avd is already present but could not be loaded', () => {
    mockery.registerMock('./utils/common', {
      getBinaryLocation: () => {
        return 'some/location';
      }
    });

    mockery.registerMock('./utils/sdk', {
      execBinarySync: () => {
        return `something not avd
        something not avd again
        Android Virtual Devices could not be loaded
        nightwatch-android-11`;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();

    let avdPresent = androidSetup.verifyAvdPresent();
    assert.strictEqual(avdPresent, false);
  });
});

describe('test verifyAdbRunning', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  test('if adb binary location not found', () => {
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
      getBinaryLocation: () => {
        return '';
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    androidSetup.verifyAdbRunning();

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('adb binary not found.'), true);
  });

  test('if adb command face error (returns null)', () => {
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
      getBinaryLocation: () => {
        return 'some/location';
      }
    });

    mockery.registerMock('./utils/sdk', {
      execBinarySync: () => {
        return null;
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    androidSetup.verifyAdbRunning();

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('try running the above command'), true);
  });

  test('if adb server is running', () => {
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
      getBinaryLocation: () => {
        return 'some/location';
      }
    });

    mockery.registerMock('./utils/sdk', {
      execBinarySync: () => {
        return '';
      }
    });

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup();
    androidSetup.verifyAdbRunning();

    const output = consoleOutput.toString();
    assert.strictEqual(output.includes('adb server is running'), true);
  });
});
