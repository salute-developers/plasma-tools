oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g pepe
$ pepe COMMAND
running command...
$ pepe (--version)
pepe/0.0.0 darwin-x64 node-v14.21.2
$ pepe --help [COMMAND]
USAGE
  $ pepe COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`pepe hello PERSON`](#pepe-hello-person)
* [`pepe hello world`](#pepe-hello-world)
* [`pepe help [COMMANDS]`](#pepe-help-commands)
* [`pepe plugins`](#pepe-plugins)
* [`pepe plugins:install PLUGIN...`](#pepe-pluginsinstall-plugin)
* [`pepe plugins:inspect PLUGIN...`](#pepe-pluginsinspect-plugin)
* [`pepe plugins:install PLUGIN...`](#pepe-pluginsinstall-plugin-1)
* [`pepe plugins:link PLUGIN`](#pepe-pluginslink-plugin)
* [`pepe plugins:uninstall PLUGIN...`](#pepe-pluginsuninstall-plugin)
* [`pepe plugins:uninstall PLUGIN...`](#pepe-pluginsuninstall-plugin-1)
* [`pepe plugins:uninstall PLUGIN...`](#pepe-pluginsuninstall-plugin-2)
* [`pepe plugins update`](#pepe-plugins-update)

## `pepe hello PERSON`

Say hello

```
USAGE
  $ pepe hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/salute-developers/plasma-tools/blob/v0.0.0/dist/commands/hello/index.ts)_

## `pepe hello world`

Say hello world

```
USAGE
  $ pepe hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ pepe hello world
  hello world! (./src/commands/hello/world.ts)
```

## `pepe help [COMMANDS]`

Display help for pepe.

```
USAGE
  $ pepe help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for pepe.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.6/src/commands/help.ts)_

## `pepe plugins`

List installed plugins.

```
USAGE
  $ pepe plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ pepe plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `pepe plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ pepe plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ pepe plugins add

EXAMPLES
  $ pepe plugins:install myplugin 

  $ pepe plugins:install https://github.com/someuser/someplugin

  $ pepe plugins:install someuser/someplugin
```

## `pepe plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ pepe plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ pepe plugins:inspect myplugin
```

## `pepe plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ pepe plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ pepe plugins add

EXAMPLES
  $ pepe plugins:install myplugin 

  $ pepe plugins:install https://github.com/someuser/someplugin

  $ pepe plugins:install someuser/someplugin
```

## `pepe plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ pepe plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ pepe plugins:link myplugin
```

## `pepe plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ pepe plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ pepe plugins unlink
  $ pepe plugins remove
```

## `pepe plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ pepe plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ pepe plugins unlink
  $ pepe plugins remove
```

## `pepe plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ pepe plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ pepe plugins unlink
  $ pepe plugins remove
```

## `pepe plugins update`

Update installed plugins.

```
USAGE
  $ pepe plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
