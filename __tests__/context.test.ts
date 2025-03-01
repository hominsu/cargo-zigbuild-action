import * as fs from 'fs'
import * as path from 'path'
import { Context } from '@actions/github/lib/context'
import { Git } from '@docker/actions-toolkit/lib/git'
import { GitHub } from '@docker/actions-toolkit/lib/github'
import { afterEach, beforeEach, describe, expect, it, jest, test } from '@jest/globals'
import * as dotenv from 'dotenv'

import { ContextSource, getContext, getInputs, Inputs } from '../src/context'

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(GitHub, 'context', 'get').mockImplementation((): Context => {
    return new Context()
  })
})

describe('getInputs', () => {
  beforeEach(() => {
    process.env = Object.keys(process.env).reduce((object, key) => {
      if (!key.startsWith('INPUT_')) {
        object[key] = process.env[key]
      }
      return object
    }, {})
  })

  // prettier-ignore
  test.each([
    [
      0,
      new Map<string, string>([
        ['name', ''],
        ['args', 'target=x86_64-pc-windows-gnu'],
      ]),
      {
        context: ContextSource.workflow,
        workdir: '.',
        outdir: './artifacts',
        name: '',
        args: ['target=x86_64-pc-windows-gnu'],
        githubToken: '',
      } as Inputs
    ],
    [
      1,
      new Map<string, string>([
        ['name', ''],
        ['args', 'target=x86_64-pc-windows-gnu\ntarget=x86_64-apple-darwin'],
      ]),
      {
        context: ContextSource.workflow,
        workdir: '.',
        outdir: './artifacts',
        name: '',
        args: ['target=x86_64-pc-windows-gnu', 'target=x86_64-apple-darwin'],
        githubToken: '',
      } as Inputs
    ],
    [
      2,
      new Map<string, string>([
        ['name', ''],
        ['args', 'target=x86_64-pc-windows-gnu\n#comment\ntarget=x86_64-apple-darwin'],
      ]),
      {
        context: ContextSource.workflow,
        workdir: '.',
        outdir: './artifacts',
        name: '',
        args: ['target=x86_64-pc-windows-gnu', 'target=x86_64-apple-darwin'],
        githubToken: '',
      } as Inputs
    ],
  ])(
    '[%d] given %p as inputs, returns %p',
    async (num: number, inputs: Map<string, string>, expected: Inputs) => {
      inputs.forEach((value: string, name: string) => {
        setInput(name, value);
      });
      expect(await getInputs()).toEqual(expected);
    }
  );
})

describe('getContext', () => {
  const originalEnv = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = {
      ...originalEnv,
      ...dotenv.parse(fs.readFileSync(path.join(__dirname, 'fixtures/event_tag_v1.1.1.env')))
    }
  })
  afterEach(() => {
    process.env = originalEnv
  })

  it('workflow', async () => {
    const context = await getContext(ContextSource.workflow)
    expect(context.ref).toEqual('refs/tags/v1.1.1')
    expect(context.sha).toEqual('860c1904a1ce19322e91ac35af1ab07466440c37')
  })

  it('git', async () => {
    jest.spyOn(Git, 'context').mockImplementation((): Promise<Context> => {
      return Promise.resolve({
        ref: 'refs/heads/git-test',
        sha: 'git-test-sha'
      } as Context)
    })
    const context = await getContext(ContextSource.git)
    expect(context.ref).toEqual('refs/heads/git-test')
    expect(context.sha).toEqual('git-test-sha')
  })
})

// See: https://github.com/actions/toolkit/blob/master/packages/core/src/core.ts#L67
function getInputName(name: string): string {
  return `INPUT_${name.replace(/ /g, '_').toUpperCase()}`
}

function setInput(name: string, value: string): void {
  process.env[getInputName(name)] = value
}
