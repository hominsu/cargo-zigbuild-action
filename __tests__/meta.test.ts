import * as fs from 'fs'
import * as path from 'path'
import { Context } from '@actions/github/lib/context'
import { GitHub } from '@docker/actions-toolkit/lib/github'
import { beforeEach, describe, expect, jest, test } from '@jest/globals'
import * as dotenv from 'dotenv'

import { Target } from '../src/compile-arg'
import { ContextSource, getContext, getInputs, Inputs } from '../src/context'
import { Command, Meta, Version } from '../src/meta'

beforeEach(() => {
  jest.clearAllMocks()
  Object.keys(process.env).forEach(function (key) {
    if (key !== 'GITHUB_TOKEN' && key.startsWith('GITHUB_')) {
      delete process.env[key]
    }
  })

  jest.spyOn(GitHub, 'context', 'get').mockImplementation((): Context => {
    //@ts-expect-error partial info
    return {
      ...new Context(),
      repo: {
        owner: 'docker',
        repo: 'repo'
      }
    }
  })
})

const tagsLabelsTest = async (
  name: string,
  envFile: string,
  inputs: Inputs,
  exVersion: Version,
  exTargets: Array<Target>,
  exCommands: Array<Command>
) => {
  process.env = dotenv.parse(fs.readFileSync(path.join(__dirname, 'fixtures', envFile)))
  const meta = new Meta({ ...getInputs(), ...inputs }, await getContext(ContextSource.workflow))

  const version = meta.version
  expect(version).toEqual(exVersion)

  const targets = meta.getTargets()
  expect(targets).toEqual(exTargets)

  const cmds = meta.getCompileCommands()
  expect(cmds).toEqual(exCommands)
}

describe('null', () => {
  test.each([
    [
      'null01',
      'event_null.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'null02',
      'event_empty.env',
      {
        args: ['target=x86_64-apple-darwin']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'apple',
          os: 'darwin',
          abi: null
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['zigbuild', '--target=x86_64-apple-darwin']
        } as Command
      ]
    ]
  ])('given %p with %p event', tagsLabelsTest)
})

describe('tag', () => {
  test.each([
    [
      'tag01',
      'event_tag_1.0dev4.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag02',
      'event_tag_1.1beta2.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag03',
      'event_tag_1.2.3rc2.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag04',
      'event_tag_1.2.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag05',
      'event_tag_1.2post1.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag06',
      'event_tag_p1-v1.0.0.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag07',
      'event_tag_v1.1.1.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: '1.1.1'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag08',
      'event_tag_v1.1.1.env',
      {
        args: ['release,target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: '1.1.1'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu', '--release']
        } as Command
      ]
    ],
    [
      'tag09',
      'event_tag_v1.1.1.env',
      {
        args: ['release,target=x86_64-pc-windows-gnu,features=mimalloc']
      } as Inputs,
      {
        main: '1.1.1'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu', '--release', '--features=mimalloc']
        } as Command
      ]
    ],
    [
      'tag10',
      'event_tag_v1.1.1.env',
      {
        args: [`release,target=x86_64-pc-windows-gnu,"features=mimalloc,impersonate"`]
      } as Inputs,
      {
        main: '1.1.1'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: [
            'build',
            '--target=x86_64-pc-windows-gnu',
            '--release',
            '--features=mimalloc,impersonate'
          ]
        } as Command
      ]
    ],
    [
      'tag11',
      'event_tag_v1.2.3rc2.env',
      {
        args: ['target=x86_64-pc-windows-gnu']
      } as Inputs,
      {
        main: undefined
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'pc',
          os: 'windows',
          abi: 'gnu'
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['build', '--target=x86_64-pc-windows-gnu']
        } as Command
      ]
    ],
    [
      'tag12',
      'event_tag_v2.0.8-beta.67.env',
      {
        args: ['target=x86_64-apple-darwin']
      } as Inputs,
      {
        main: '2.0.8-beta.67'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'apple',
          os: 'darwin',
          abi: null
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['zigbuild', '--target=x86_64-apple-darwin']
        } as Command
      ]
    ],
    [
      'tag13',
      'event_tag_v2.0.8-beta.67.env',
      {
        args: ['release,target=x86_64-apple-darwin']
      } as Inputs,
      {
        main: '2.0.8-beta.67'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'apple',
          os: 'darwin',
          abi: null
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['zigbuild', '--target=x86_64-apple-darwin', '--release']
        } as Command
      ]
    ],
    [
      'tag14',
      'event_tag_v2.0.8-beta.67.env',
      {
        args: ['release,target=x86_64-apple-darwin,features=mimalloc']
      } as Inputs,
      {
        main: '2.0.8-beta.67'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'apple',
          os: 'darwin',
          abi: null
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: ['zigbuild', '--target=x86_64-apple-darwin', '--release', '--features=mimalloc']
        } as Command
      ]
    ],
    [
      'tag15',
      'event_tag_v2.0.8-beta.67.env',
      {
        args: [`release,target=x86_64-apple-darwin,"features=mimalloc,impersonate"`]
      } as Inputs,
      {
        main: '2.0.8-beta.67'
      } as Version,
      [
        {
          arch: 'x86_64',
          vendor: 'apple',
          os: 'darwin',
          abi: null
        } as Target
      ],
      [
        {
          exec: 'cargo',
          args: [
            'zigbuild',
            '--target=x86_64-apple-darwin',
            '--release',
            '--features=mimalloc,impersonate'
          ]
        } as Command
      ]
    ]
  ])('given %p with %p event', tagsLabelsTest)
})
