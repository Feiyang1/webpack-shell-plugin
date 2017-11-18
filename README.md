# Webpack Synchronizable Shell Plugin
This plugin is a fork of [webpack-shell-plugin](https://github.com/1337programming/webpack-shell-plugin).

It differs from [webpack-shell-plugin](https://github.com/1337programming/webpack-shell-plugin) by allowing user to customize script execution order. For example, we can specify that webpack should block until user's precompile scripts finish executing. Another example is we can execute scripts in the order in which they are specified, or we can execute them in parallel. 

The point of this plugin is to give users freedom in choosing how scripts are executed.

## Installation

`npm install --save-dev webpack-synchronizable-shell-plugin`

## Setup
In `webpack.config.js`:

```js
const WebpackSynchronizableShellPlugin = require('webpack-synchronizable-shell-plugin');

module.exports = {
  ...
  ...
  plugins: [
    new WebpackSynchronizableShellPlugin({
      onBuildStart:{
        scripts: ['echo "Webpack Start"'],
        blocking: true,
        parallel: false
      }, 
      onBuildEnd:{
        scripts: ['echo "Webpack End"'],
        blocking: false,
        parallel: true
      }
  })],
  ...
}
```

### API
* `onBuildStart`: configuration object for scripts that execute before a compilation. 
**Default:**
```js
  {
    scripts: [],
    blocking: false,
    parallel: false
  }
```
* `onBuildEnd`: configuration object for scripts that execute after files are emitted at the end of the compilation. 
**Default:**
```js
  {
    scripts: [],
    blocking: false,
    parallel: false
  }
```
* `onBuildExit`: configuration object for scripts that execute after webpack's process is complete. *Note: this event also fires in `webpack --watch` when webpack has finished updating the bundle.*
**Default:**
```js
  {
    scripts: [],
    blocking: false,
    parallel: false
  }
```
* `blocking (onBuildStart, onBuildEnd, onBuildExit)`: block webpack until scripts finish execution.
* `parallel (onBuildStart, onBuildEnd, onBuildExit)`: execute scripts in parallel, otherwise execute scripts in the order in which they are specified in the scripts array.

**Note:** below combination is not supported.
 ```js
  {
    blocking: true
    parallel: true
  } 
 ```

* `dev`: switch for development environments. This causes scripts to execute once. Useful for running HMR on webpack-dev-server or webpack watch mode. **Default: true**
* `safe`: switches script execution process from spawn to exec. If running into problems with spawn, turn this setting on. **Default: false**
* `verbose`: **DEPRECATED** enable for verbose output. **Default: false**
