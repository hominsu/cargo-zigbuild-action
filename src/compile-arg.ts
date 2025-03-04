import * as core from '@actions/core'
import { parse } from 'csv-parse/sync'

export class Target {
  arch: string | null
  vendor: string | null
  os: string | null
  abi: string | null

  constructor(input: string) {
    const parts = input.split('-')
    this.arch = parts[0] || null
    this.vendor = parts[1] || null
    this.os = parts[2] || null
    this.abi = parts.length > 3 ? parts.slice(3).join('-') : null

    if (this.arch === null) {
      core.error(`Invalid Arch: ${this.arch}`)
    }
    if (this.vendor === null) {
      core.error(`Invalid Vendor: ${this.vendor}`)
    }
    if (this.os === null) {
      core.error(`Invalid OS: ${this.os}`)
    }
  }

  public get Arch(): string {
    return this.arch!
  }

  public get Vendor(): string {
    return this.vendor!
  }

  public get OS(): string {
    return this.os!
  }

  public get ABI(): string | null {
    return this.abi
  }

  public toString(): string {
    return [this.arch, this.vendor, this.os, this.abi].filter(Boolean).join('-')
  }
}

export class CompileArg {
  public target?: Target
  public attrs: Record<string, string | null>

  constructor() {
    this.attrs = {}
  }

  public get Target(): Target | undefined {
    return this.target
  }

  public get Args(): Array<string> {
    return [
      ...(this.target ? [`--target=${this.target}`] : []),
      ...Object.entries(this.attrs).map(([key, value]) =>
        value ? `--${key}=${value}` : `--${key}`
      )
    ]
  }

  public toString(): string {
    return this.Args.join(' ')
  }
}

export function Transform(input: string[]): CompileArg[] {
  const args: CompileArg[] = []

  for (const arg of input) {
    args.push(Parse(arg))
  }

  core.startGroup(`Processing compile args input`)
  for (const arg of args) {
    core.info(arg.toString())
  }
  core.endGroup()

  return args
}

export function Parse(s: string): CompileArg {
  const fields = parse(s, {
    quote: `'`,
    relaxColumnCount: true,
    skipEmptyLines: true
  })[0]

  const arg = new CompileArg()
  for (const field of fields) {
    const parts = field
      .toString()
      .split(/(?<=^[^=]+?)=/)
      .map((item) => item.trim())

    const key = parts[0].toLowerCase()

    if (parts.length == 1) {
      arg.attrs[key] = null
    } else {
      const value = parts[1]
      switch (key) {
        case 'target': {
          arg.target = new Target(value)
          break
        }
        default: {
          arg.attrs[key] = value
          break
        }
      }
    }
  }

  return arg
}
