import * as fs from 'fs'
import * as path from 'path'
import * as core from '@actions/core'
import * as io from '@actions/io'
import * as actionsToolkit from '@docker/actions-toolkit'
import { Exec } from '@docker/actions-toolkit/lib/exec'
import * as tar from 'tar'

import { Target } from './compile-arg'
import { getContext, getInputs, Inputs } from './context'
import { Command, Meta, Version } from './meta'

async function listInstalledTargets(env: { [key: string]: string }): Promise<Array<string>> {
  const installed = await Exec.getExecOutput('rustup', ['target', 'list'], {
    env,
    ignoreReturnCode: true
  }).then((res) => {
    if (res.stderr.length > 0 && res.exitCode != 0) {
      throw Error(res.stderr)
    }

    return res.stdout
      .split('\n')
      .filter((line) => line.includes('(installed)'))
      .map((line) => line.replace(/\s*\(installed\)$/, '').trim())
  })

  return installed
}

async function addTargets(targets: Array<string>, env: { [key: string]: string }): Promise<void> {
  for (const target of targets) {
    await Exec.getExecOutput('rustup', ['target', 'add', target], {
      env,
      ignoreReturnCode: true
    }).then((res) => {
      if (res.stderr.length > 0 && res.exitCode != 0) {
        throw Error(res.stderr)
      }
    })
  }
}

async function compress(
  workdir: string,
  outdir: string,
  name: string,
  version: string,
  targets: Array<Target>
): Promise<void> {
  await io.mkdirP(outdir)

  const tasks = targets.map(async (target) => {
    try {
      const ext = target.OS === 'windows' ? '.exe' : ''
      const binary = path.join('target', target.toString(), 'release', `${name}${ext}`)
      const artifact = path.join(outdir, `${name}-${version}-${target.toString()}.tar.gz`)

      core.debug(`Compressing ${binary} to ${artifact}`)

      return new Promise<void>((resolve, reject) => {
        const writeStream = fs.createWriteStream(artifact)
        writeStream.on('error', reject)
        writeStream.on('close', resolve)

        tar
          .create(
            {
              cwd: workdir,
              gzip: true,
              strict: true
            },
            [binary]
          )
          .on('error', reject)
          .pipe(writeStream)
      })
    } catch (error) {
      core.error(`Failed to compress artifact for target ${target.toString()}: ${error}`)
      throw error
    }
  })

  await Promise.all(tasks)
}

actionsToolkit.run(async () => {
  const inputs: Inputs = getInputs()
  const context = await getContext(inputs.context)

  await core.group(`Context info`, async () => {
    core.info(`eventName: ${context.eventName}`)
    core.info(`sha: ${context.sha}`)
    core.info(`ref: ${context.ref}`)
    core.info(`workflow: ${context.workflow}`)
    core.info(`action: ${context.action}`)
    core.info(`actor: ${context.actor}`)
    core.info(`runNumber: ${context.runNumber}`)
    core.info(`runId: ${context.runId}`)
  })

  if (core.isDebug()) {
    await core.group(`Webhook payload`, async () => {
      core.info(JSON.stringify(context.payload, null, 2))
    })
  }

  const meta: Meta = new Meta(inputs, context)

  const version: Version = meta.version
  if (meta.version.main == undefined || meta.version.main.length == 0) {
    core.error(`No version has been generated. Check tags input.`)
  } else {
    await core.group(`Version`, async () => {
      core.info(version.main || '')
    })
  }

  const buildEnv = Object.assign({}, process.env) as {
    [key: string]: string
  }

  const targets: Array<Target> = meta.getTargets()
  await core.group(`Install Rust targets`, async () => {
    const installed = await listInstalledTargets(buildEnv)
    const notInstalled = targets
      .map((target) => target.toString())
      .filter((target) => !installed.includes(target))

    for (const target of installed) {
      core.info(`${target} (installed)`)
    }
    for (const target of notInstalled) {
      core.info(`${target} (not installed)`)
    }

    await addTargets(notInstalled, buildEnv)
  })

  const cmds: Array<Command> = meta.getCompileCommands()
  await core.group('Compile Cargo project', async () => {
    for (const cmd of cmds) {
      core.info(`$ ${cmd.exec} ${cmd.args.join(' ')}`)
      await Exec.getExecOutput(cmd.exec, cmd.args, {
        cwd: inputs.workdir,
        env: buildEnv,
        ignoreReturnCode: true
      }).then((res) => {
        if (res.stderr.length > 0 && res.exitCode != 0) {
          throw Error(res.stderr)
        }
      })
    }
  })

  await core.group('Compress artifacts', async () => {
    await compress(inputs.workdir, inputs.outdir, inputs.name, version.main!, targets)
  })
})
