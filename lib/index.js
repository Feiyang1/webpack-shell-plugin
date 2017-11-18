'use strict';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var spawnSync = require('child_process').spawnSync;
var execSync = require('child_process').execSync;
var os = require('os');
require('babel-polyfill');

var defaultOptions = {
  onBuildStart: {
    scripts: [],
    blocking: false,
    parallel: false
  },
  onBuildEnd: {
    scripts: [],
    blocking: false,
    parallel: false
  },
  onBuildExit: {
    scripts: [],
    blocking: false,
    parallel: false
  },
  dev: true,
  verbose: false,
  safe: false
};

var WebpackSynchronizableShellPlugin = function () {
  function WebpackSynchronizableShellPlugin(options) {
    classCallCheck(this, WebpackSynchronizableShellPlugin);

    this.options = this.validateInput(this.mergeOptions(options, defaultOptions));
  }

  createClass(WebpackSynchronizableShellPlugin, [{
    key: 'putsAsync',
    value: function putsAsync(resolve) {
      return function (error, stdout, stderr) {
        if (error) {
          throw error;
        }
        resolve();
      };
    }
  }, {
    key: 'spreadStdoutAndStdErr',
    value: function spreadStdoutAndStdErr(proc) {
      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stdout);
    }
  }, {
    key: 'serializeScript',
    value: function serializeScript(script) {
      if (typeof script === 'string') {
        var _script$split = script.split(' '),
            _script$split2 = toArray(_script$split),
            _command = _script$split2[0],
            _args = _script$split2.slice(1);

        return { command: _command, args: _args };
      }
      var command = script.command,
          args = script.args;

      return { command: command, args: args };
    }
  }, {
    key: 'handleScript',
    value: function handleScript(script) {
      if (os.platform() === 'win32' || this.options.safe) {
        var buffer = execSync(script, { stdio: 'inherit' });
      } else {
        var _serializeScript = this.serializeScript(script),
            command = _serializeScript.command,
            args = _serializeScript.args;

        spawnSync(command, args, { stdio: 'inherit' });
      }
    }
  }, {
    key: 'handleScriptAsync',
    value: function handleScriptAsync(script) {
      var _this = this;

      if (os.platform() === 'win32' || this.options.safe) {
        return new Promise(function (resolve) {
          return _this.spreadStdoutAndStdErr(exec(script, _this.putsAsync(resolve)));
        });
      }

      var _serializeScript2 = this.serializeScript(script),
          command = _serializeScript2.command,
          args = _serializeScript2.args;

      var proc = spawn(command, args, { stdio: 'inherit' });
      return new Promise(function (resolve) {
        return proc.on('close', _this.putsAsync(resolve));
      });
    }
  }, {
    key: 'executeScripts',
    value: function () {
      var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(scripts, parallel, blocking) {
        var i, _i, _i2;

        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(!scripts || scripts.length <= 0)) {
                  _context.next = 2;
                  break;
                }

                return _context.abrupt('return');

              case 2:
                if (!(blocking && !parallel)) {
                  _context.next = 6;
                  break;
                }

                for (i = 0; i < scripts.length; i++) {
                  this.handleScript(scripts[i]);
                }
                _context.next = 21;
                break;

              case 6:
                if (!(!blocking && !parallel)) {
                  _context.next = 16;
                  break;
                }

                _i = 0;

              case 8:
                if (!(_i < scripts.length)) {
                  _context.next = 14;
                  break;
                }

                _context.next = 11;
                return this.handleScriptAsync(scripts[_i]);

              case 11:
                _i++;
                _context.next = 8;
                break;

              case 14:
                _context.next = 21;
                break;

              case 16:
                if (!(blocking && parallel)) {
                  _context.next = 20;
                  break;
                }

                throw new Exception("Not supported");

              case 20:
                if (!blocking && parallel) {
                  for (_i2 = 0; _i2 < scripts.length; _i2++) {
                    this.handleScriptAsync(scripts[_i2], blocking);
                  }
                }

              case 21:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function executeScripts(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return executeScripts;
    }()
  }, {
    key: 'validateInput',
    value: function validateInput(options) {
      if (typeof options.onBuildStart.scripts === 'string') {
        options.onBuildStart.scripts = options.onBuildStart.scripts.split('&&');
      }
      if (typeof options.onBuildEnd.scripts === 'string') {
        options.onBuildEnd.scripts = options.onBuildEnd.scripts.split('&&');
      }
      if (typeof options.onBuildExit === 'string') {
        options.onBuildExit.scripts = options.onBuildExit.scripts.split('&&');
      }
      return options;
    }
  }, {
    key: 'mergeOptions',
    value: function mergeOptions(options, defaults) {
      for (var key in defaults) {
        if (options.hasOwnProperty(key)) {
          defaults[key] = options[key];
        }
      }
      return defaults;
    }
  }, {
    key: 'apply',
    value: function apply(compiler) {
      var _this2 = this;

      compiler.plugin('compile', function (compilation) {
        var onBuildStartOption = _this2.options.onBuildStart;
        if (_this2.options.verbose) {
          console.log('Report compilation: ' + compilation);
          console.warn('WebpackShellPlugin [' + new Date() + ']: Verbose is being deprecated, please remove.');
        }
        if (onBuildStartOption.scripts && onBuildStartOption.scripts.length > 0) {
          console.log('Executing pre-build scripts');
          _this2.executeScripts(onBuildStartOption.scripts, onBuildStartOption.parallel, onBuildStartOption.blocking);

          if (_this2.options.dev) {
            _this2.options.onBuildStart = [];
          }
        }
      });

      compiler.plugin('after-emit', function (compilation, callback) {
        var onBuildEndOption = _this2.options.onBuildEnd;
        if (onBuildEndOption.scripts && onBuildEndOption.scripts.length > 0) {
          console.log('Executing post-build scripts');
          _this2.executeScripts(onBuildEndOption.scripts, onBuildEndOption.parallel, onBuildEndOption.blocking);
          if (_this2.options.dev) {
            _this2.options.onBuildEnd = [];
          }
        }
        callback();
      });

      compiler.plugin('done', function () {
        var onBuildExitOption = _this2.options.onBuildExit;
        if (onBuildExitOption.scripts && onBuildExitOption.scripts.length > 0) {
          console.log('Executing additional scripts before exit');
          _this2.executeScripts(onBuildExitOption.scripts, onBuildExitOption.parallel, onBuildExitOption.blocking);
        }
      });
    }
  }]);
  return WebpackSynchronizableShellPlugin;
}();

module.exports = WebpackSynchronizableShellPlugin;