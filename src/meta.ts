import * as core from '@actions/core'
import { Context } from '@actions/github/lib/context'
import * as handlebars from 'handlebars'
import * as semver from 'semver'

import * as tcl from './compile-arg'
import { Inputs } from './context'

export interface Version {
  main: string | undefined
}

export interface Command {
  exec: string
  args: Array<string>
}

export class Meta {
  public readonly version: Version

  private readonly context: Context
  private readonly args: tcl.CompileArg[]

  constructor(inputs: Inputs, context: Context) {
    this.context = context
    this.args = tcl.Transform(inputs.args)
    this.version = this.getVersion()
  }

  private getVersion(): Version {
    const version: Version = {
      main: undefined
    }

    if (!/^refs\/tags\//.test(this.context.ref)) {
      return version
    }

    let vraw: string = this.context.ref.replace(/^refs\/tags\//g, '').replace(/\//g, '-')
    if (!semver.valid(vraw)) {
      core.error(`${vraw} is not a valid semver. More info: https://semver.org/`)
      return version
    }

    const sver = semver.parse(vraw, {
      loose: true
    })
    vraw = handlebars.compile('{{version}}')(sver)

    version.main = Meta.sanitizeTag(vraw)

    return version
  }

  public getTargets(): Array<tcl.Target> {
    const targets: Array<tcl.Target> = []
    for (const arg of this.args) {
      targets.push(arg.Target!)
    }
    return targets
  }

  public getCompileCommands(): Array<Command> {
    const cmds: Array<Command> = []
    for (const arg of this.args) {
      const cmd = {
        exec: 'cargo',
        args: [arg.Target!.OS === 'windows' ? 'build' : 'zigbuild', ...arg.Args]
      } as Command
      cmds.push(cmd)
    }
    return cmds
  }

  private static sanitizeTag(tag: string): string {
    return tag.replace(/[^a-zA-Z0-9._-]+/g, '-')
  }
}
