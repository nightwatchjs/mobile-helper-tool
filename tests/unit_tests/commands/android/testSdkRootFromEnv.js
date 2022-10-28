const assert = require('assert');
const {config: dotenv_config} = require('dotenv');
const fs = require('fs');
const mockery = require('mockery');
const path = require('path');
const os = require('os');

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

    const rootDir = path.join(__dirname, 'fixtures');

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
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

    const rootDir = path.join(__dirname, 'fixtures');

    const {AndroidSetup} = require('../../../../src/commands/android/index');
    const androidSetup = new AndroidSetup({}, rootDir);
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
