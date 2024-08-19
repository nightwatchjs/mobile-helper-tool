const assert = require('assert');
const mockery = require('mockery');

describe('test verifyOptions', function() {
  beforeEach(() => {
    mockery.enable({useCleanCache: true, warnOnReplace: false, warnOnUnregistered: false});

    mockery.registerMock('./adb', {});
  });

  afterEach(() => {
    mockery.deregisterAll();
    mockery.resetCache();
    mockery.disable();
  });

  it('shows error for unknown flags', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [{
            name: 'flag1'
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result = verifyOptions('subcmd1', {random: true});
    const output = consoleOutput.toString();

    assert.strictEqual(output.includes('Unknown flag(s) passed for \'subcmd1\' subcommand: random'), true);
    assert.deepStrictEqual(result, false);
  });

  it('does not show error for no unknown flags', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [{
            name: 'flag1'
          },
          {
            name: 'flag2'
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result1 = verifyOptions('subcmd1', {flag1: true});
    const output1 = consoleOutput.toString();

    assert.strictEqual(output1.includes('Unknown flag(s) passed'), false);
    assert.deepStrictEqual(result1, {subcommandFlag: 'flag1', configs: []});

    consoleOutput.length = 0;
    const result2 = verifyOptions('subcmd1', {flag2: true});
    const output2 = consoleOutput.toString();

    assert.strictEqual(output2.includes('Unknown flag(s) passed'), false);
    assert.deepStrictEqual(result2, {subcommandFlag: 'flag2', configs: []});
  });

  it('shows error if more than one flags passed', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [{
            name: 'flag1'
          },
          {
            name: 'flag2'
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result1 = verifyOptions('subcmd1', {flag1: true, flag2: true});
    const output1 = consoleOutput.toString();

    assert.strictEqual(output1.includes('Too many flags passed for \'subcmd1\' subcommand: flag1, flag2 (only one expected)'), true);
    assert.deepStrictEqual(result1, false);

    consoleOutput.length = 0;
    const result2 = verifyOptions('subcmd1', {flag1: true, flag2: true, random: true});
    const output2 = consoleOutput.toString();

    assert.strictEqual(output2.includes('Too many flags passed for \'subcmd1\' subcommand: flag1, flag2 (only one expected)'), true);
    assert.deepStrictEqual(result2, false);
  });

  it('shows error for unknown cliConfigs corresponding to subcommand', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [],
          cliConfigs: [{
            name: 'config1',
            alias: []
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result = verifyOptions('subcmd1', {random: true});
    const output = consoleOutput.toString();

    assert.strictEqual(output.includes('Unknown config(s) passed for \'subcmd1\' subcommand: random'), true);
    assert.deepStrictEqual(result, false);
  });

  it('does not show error for no unknown cliConfigs corresponding to subcommand', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [],
          cliConfigs: [{
            name: 'config1',
            alias: ['c1']
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result1 = verifyOptions('subcmd1', {config1: true});
    const output1 = consoleOutput.toString();

    assert.strictEqual(output1.includes('Unknown config(s) passed'), false);
    assert.deepStrictEqual(result1, {subcommandFlag: '', configs: ['config1']});

    consoleOutput.length = 0;

    const result2 = verifyOptions('subcmd1', {c1: true});
    const output2 = consoleOutput.toString();

    assert.strictEqual(output2.includes('Unknown config(s) passed'), false);
    assert.deepStrictEqual(result2, {subcommandFlag: '', configs: ['c1']});
  });

  it('shows error for unknown cliConfigs corresponding to flag', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [{
            name: 'flag1',
            cliConfigs: [{
              name: 'config1',
              alias: []
            }]
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result = verifyOptions('subcmd1', {flag1: true, random: true});
    const output = consoleOutput.toString();

    assert.strictEqual(output.includes('Unknown config(s) passed for \'--flag1\' flag: random'), true);
    assert.deepStrictEqual(result, false);
  });

  it('does not show error for no unknown cliConfigs corresponding to flag', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [{
            name: 'flag1',
            cliConfigs: [{
              name: 'config1',
              alias: ['c1']
            }]
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result1 = verifyOptions('subcmd1', {flag1: true, config1: true});
    const output1 = consoleOutput.toString();

    assert.strictEqual(output1.includes('Unknown config(s) passed'), false);
    assert.deepStrictEqual(result1, {subcommandFlag: 'flag1', configs: ['config1']});

    consoleOutput.length = 0;

    const result2 = verifyOptions('subcmd1', {flag1: true, c1: true});
    const output2 = consoleOutput.toString();

    assert.strictEqual(output2.includes('Unknown config(s) passed'), false);
    assert.deepStrictEqual(result2, {subcommandFlag: 'flag1', configs: ['c1']});
  });

  it('does not log anything for no flag and no config passed', () => {
    const consoleOutput = [];
    mockery.registerMock(
      '../../../logger',
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
      gray: colorFn,
      grey: colorFn
    });

    mockery.registerMock('../constants', {
      AVAILABLE_SUBCOMMANDS: {
        subcmd1: {
          flags: [{
            name: 'flag1',
            cliConfigs: [{
              name: 'config1',
              alias: ['c1']
            }]
          }]
        },
        subcmd2: {
          flags: [],
          cliConfigs: [{
            name: 'config2',
            alias: ['c2']
          }]
        }
      }
    });

    const {verifyOptions} = require('../../../../../src/commands/android/subcommands/common');
    const result1 = verifyOptions('subcmd1', {});

    assert.strictEqual(consoleOutput.length, 0);
    assert.deepStrictEqual(result1, {subcommandFlag: '', configs: []});

    consoleOutput.length = 0;

    const result2 = verifyOptions('subcmd2', {});

    assert.strictEqual(consoleOutput.length, 0);
    assert.deepStrictEqual(result2, {subcommandFlag: '', configs: []});
  });
});

