import http from 'node:http'
import fs from 'node:fs'
import { URL } from 'node:url'
import { Client } from '@gradio/client'

loadEnvFile()

const port = Number(process.env.PORT || 8787)
const spaceId = process.env.HUGGING_FACE_SPACE_ID 
const apiToken = process.env.HUGGING_FACE_API_TOKEN || ''
const serviceName = 'phishguard-backend'
let cachedClientPromise = null

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

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  })
  response.end(JSON.stringify(payload))
}

function buildHealthPayload() {
  return {
    ok: true,
    service: serviceName,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
  }
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function buildPrompt({ sender, subject, body }) {
  return `Analyze this email for phishing risk.

SENDER: ${sender || '(not provided)'}
SUBJECT: ${subject || '(not provided)'}
BODY:
${body}`
}

function normalizeIndicator(indicator) {
  const severity = ['high', 'medium', 'low'].includes(indicator?.severity)
    ? indicator.severity
    : 'low'

  return {
    severity,
    text: String(indicator?.text || 'Potential phishing signal detected.'),
  }
}

function normalizeModelResponse(payload) {
  const score = Math.min(100, Math.max(0, Number(payload?.risk_score) || 0))
  const verdict = String(payload?.verdict || 'SUSPICIOUS').toUpperCase()
  const indicators = Array.isArray(payload?.indicators)
    ? payload.indicators.map(normalizeIndicator)
    : []

  return {
    risk_score: score,
    verdict: ['SAFE', 'SUSPICIOUS', 'PHISHING'].includes(verdict) ? verdict : 'SUSPICIOUS',
    verdict_reason: String(payload?.verdict_reason || 'Some signals need closer review.'),
    indicators,
    summary: String(payload?.summary || 'Analysis complete.'),
  }
}

function deriveResultFromText(outputText) {
  const normalizedText = String(outputText || '').trim()
  const lowerText = normalizedText.toLowerCase()

  let verdict = 'SUSPICIOUS'
  let riskScore = 55
  let verdictReason = 'The model returned a suspicious classification.'

  if (lowerText.includes('phishing')) {
    verdict = 'PHISHING'
    riskScore = 88
    verdictReason = 'The Hugging Face model classified this email as phishing.'
  } else if (lowerText.includes('safe') || lowerText.includes('legitimate') || lowerText.includes('not phishing')) {
    verdict = 'SAFE'
    riskScore = 18
    verdictReason = 'The Hugging Face model classified this email as safe.'
  }

  return normalizeModelResponse({
    risk_score: riskScore,
    verdict,
    verdict_reason: verdictReason,
    indicators: [
      {
        severity: verdict === 'PHISHING' ? 'high' : verdict === 'SAFE' ? 'low' : 'medium',
        text: normalizedText || 'Model classification completed.',
      },
    ],
    summary: normalizedText || 'The model returned a classification without additional explanation.',
  })
}

async function getGradioClient() {
  if (!cachedClientPromise) {
    const connectOptions = apiToken ? { hf_token: apiToken } : undefined
    cachedClientPromise = Client.connect(spaceId, connectOptions).catch((error) => {
      cachedClientPromise = null

      const message = error instanceof Error ? error.message : String(error)
      if (message.toLowerCase().includes('space metadata could not be loaded')) {
        throw new Error(
          `Could not connect to Hugging Face Space "${spaceId}". Check that the Space ID is correct and set HUGGING_FACE_API_TOKEN in backend/.env if the Space is private.`,
        )
      }

      throw error
    })
  }

  return cachedClientPromise
}

async function analyzeWithHuggingFace(email) {
  const client = await getGradioClient()
  const combinedText = buildPrompt(email)
  const prediction = await client.predict('/predict', {
    text: combinedText,
  })

  const outputText = Array.isArray(prediction?.data) ? prediction.data[0] : prediction?.data
  return deriveResultFromText(outputText)
}

const server = http.createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: 'Invalid request URL.' })
    return
  }

  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    })
    response.end()
    return
  }

  const requestUrl = new URL(request.url, `http://${request.headers.host}`)

  if (request.method === 'GET' && (requestUrl.pathname === '/api/health' || requestUrl.pathname === '/health')) {
    sendJson(response, 200, buildHealthPayload())
    return
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/analyze') {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) {
        request.destroy()
      }
    })

    request.on('end', async () => {
      const payload = safeJsonParse(body)
      if (!payload || typeof payload !== 'object') {
        sendJson(response, 400, { error: 'Request body must be valid JSON.' })
        return
      }

      const email = {
        sender: String(payload.sender || '').trim(),
        subject: String(payload.subject || '').trim(),
        body: String(payload.body || '').trim(),
      }

      if (!email.body) {
        sendJson(response, 400, { error: 'Email body is required for analysis.' })
        return
      }

      try {
        const result = await analyzeWithHuggingFace(email)
        sendJson(response, 200, result)
      } catch (error) {
        sendJson(response, 500, {
          error: error instanceof Error ? error.message : 'Failed to analyze the email.',
        })
      }
    })

    request.on('error', () => {
      sendJson(response, 500, { error: 'Failed to read the incoming request body.' })
    })

    return
  }

  sendJson(response, 404, { error: 'Route not found.' })
})

server.listen(port, () => {
  console.log(`PhishGuard backend listening on http://localhost:${port}`)
})
