import { describe, expect, test } from '@jest/globals'

import { CompileArg, Target, Transform } from '../src/compile-arg'

describe('target', () => {
  // prettier-ignore
  test.each([
    [
      `aarch64-unknown-linux-musl`,
      {
        arch: 'aarch64',
        vendor: 'unknown',
        os: 'linux',
        abi: 'musl'
      } as Target,
      false
    ],
    [
      `aarch64-apple-darwin`,
      {
        arch: 'aarch64',
        vendor: 'apple',
        os: 'darwin',
        abi: null
      } as Target,
      false
    ],
    [
      `aarch64-apple`,
      {} as Target,
      true
    ],
    [
      `aarch64`,
      {} as Target,
      true
    ],
    [
      ``,
      {} as Target,
      true
    ]
  ])('given %p event', async (s: string, expected: Target, invalid: boolean) => {
    try {
      const target = new Target(s)
      expect(target).toEqual(expected)
    } catch (err) {
      if (!invalid) {
        console.error(err)
      }
      expect(true).toBe(invalid)
    }
  })
})

describe('transform', () => {
  // prettier-ignore
  test.each([
    [
      [
        `target=aarch64-unknown-linux-musl`,
        `target=x86_64-unknown-linux-musl,no-default-features`,
        `target=i686-pc-windows-gnu,features=mimalloc`,
        `target=x86_64-pc-windows-gnu,"features=mimalloc,impersonate"`,
        `target=aarch64-apple-darwin,no-default-features,features=mimalloc`,
        `target=x86_64-apple-darwin,no-default-features,"features=mimalloc,impersonate"`
      ],
      [
        {
          target: {
            arch: 'aarch64',
            vendor: 'unknown',
            os: 'linux',
            abi: 'musl'
          },
          attrs: {}
        },
        {
          target: {
            arch: 'x86_64',
            vendor: 'unknown',
            os: 'linux',
            abi: 'musl'
          },
          attrs: {
            'no-default-features': null
          }
        },
        {
          target: {
            arch: 'i686',
            vendor: 'pc',
            os: 'windows',
            abi: 'gnu'
          },
          attrs: {
            'features': 'mimalloc'
          }
        },
        {
          target: {
            arch: 'x86_64',
            vendor: 'pc',
            os: 'windows',
            abi: 'gnu'
          },
          attrs: {
            'features': 'mimalloc,impersonate'
          }
        },
        {
          target: {
            arch: 'aarch64',
            vendor: 'apple',
            os: 'darwin',
            abi: null
          },
          attrs: {
            'no-default-features': null,
            'features': 'mimalloc'
          }
        },
        {
          target: {
            arch: 'x86_64',
            vendor: 'apple',
            os: 'darwin',
            abi: null
          },
          attrs: {
            'no-default-features': null,
            'features': 'mimalloc,impersonate'
          }
        }
      ] as CompileArg[],
      false
    ]
  ])('given %p', async (l: string[], expected: CompileArg[], invalid: boolean) => {
    try {
      const tags = Transform(l)
      expect(tags).toEqual(expected)
    } catch (err) {
      if (!invalid) {
        console.error(err)
      }
      expect(true).toBe(invalid)
    }
  })
})
