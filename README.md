## About

Github Action to build Cargo project with [cargo-zigbuild](https://github.com/rust-cross/cargo-zigbuild)

---

- [About](#about)
- [Usage](#usage)
- [Customizing](#customizing)
  - [inputs](#inputs)

## Usage

```yaml
name: ci

on:
  push:
    tags: [ 'v*' ]

jobs:
  build:
    if: startsWith(github.ref, 'refs/tags/')
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Build
        uses: hominsu/cargo-zigbuild-action@v1
        with:
          name: jproxy
          args: |
            target=x86_64-unknown-linux-musl,release,features=mimalloc
            target=aarch64-unknown-linux-musl,release,features=mimalloc
            target=armv7-unknown-linux-musleabihf,release,features=jemalloc
            target=arm-unknown-linux-musleabihf,release,features=jemalloc
            target=i686-unknown-linux-musl,release,features=jemalloc
            target=x86_64-apple-darwin,release
            target=aarch64-apple-darwin,release
            target=x86_64-pc-windows-gnu,release
            target=i686-pc-windows-gnu,release
```

## Customizing

### inputs

The following inputs can be used as `step.with` keys

> `List` type is a newline-delimited string
> ```yaml
> set: target.args.mybuildarg=value
> ```
> ```yaml
> set: |
>   target.args.mybuildarg=value
>   foo*.args.mybuildarg=value
> ```

> `CSV` type is a comma-delimited string
> ```yaml
> targets: default,release
> ```

| Name           | Type     | Description                                                  |
| -------------- | -------- | ------------------------------------------------------------ |
| `workdir`      | String   | Working directory of cargo/cargo-zigbuild execution          |
| `outdir`       | String   | Output directory for the build artifacts                     |
| `name`         | String   | Name of binary to compile                                    |
| `args`         | List/CSV | Arguments to pass to cargo/cargo-zigbuild                    |
| `github-token` | String   | API token used to authenticate to a Git repository for remote definitions |
