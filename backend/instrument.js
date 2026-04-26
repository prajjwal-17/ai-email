import * as Sentry from '@sentry/node'
import fs from 'node:fs'
import { URL } from 'node:url'

loadEnvFile()

Sentry.init({
  dsn: process.env.SENTRY_DSN || '',
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
})

function loadEnvFile() {
  const envPath = new URL('./.env', import.meta.url)
  if (!fs.existsSync(envPath)) {
    return
  }

  const rawEnv = fs.readFileSync(envPath, 'utf8')
  for (const line of rawEnv.split(/\r?\n/)) {
    const trimmedLine = line.trim()
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmedLine.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }

    const key = trimmedLine.slice(0, separatorIndex).trim()
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '')

    if (key && !(key in process.env)) {
      process.env[key] = value
    }
  }
}
