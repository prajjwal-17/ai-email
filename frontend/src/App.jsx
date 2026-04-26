import { useState } from 'react'
import './App.css'

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '')

const initialForm = {
  sender: '',
  subject: '',
  body: '',
}

const verdictConfig = {
  SAFE: { className: 'safe', icon: 'OK', title: 'Safe Email' },
  SUSPICIOUS: { className: 'medium', icon: '!', title: 'Suspicious Email' },
  PHISHING: { className: 'danger', icon: '!!', title: 'Phishing Detected' },
}

function normalizeResult(payload) {
  const score = Math.min(100, Math.max(0, Number(payload?.risk_score) || 0))
  const verdict = String(payload?.verdict || 'SUSPICIOUS').toUpperCase()
  const indicators = Array.isArray(payload?.indicators) ? payload.indicators : []

  if (verdict === 'SAFE' || score < 35) {
    return {
      score,
      verdict: 'SAFE',
      verdictReason: payload?.verdict_reason || 'No high-risk phishing indicators found.',
      indicators,
      summary: payload?.summary || 'The email appears low risk based on the submitted content.',
    }
  }

  if (verdict === 'PHISHING' || score >= 70) {
    return {
      score,
      verdict: 'PHISHING',
      verdictReason: payload?.verdict_reason || 'Multiple phishing signals were detected.',
      indicators,
      summary: payload?.summary || 'The email likely contains malicious or deceptive content.',
    }
  }

  return {
    score,
    verdict: 'SUSPICIOUS',
    verdictReason: payload?.verdict_reason || 'Some signals need closer review.',
    indicators,
    summary: payload?.summary || 'The email contains mixed trust signals and should be reviewed carefully.',
  }
}

function buildApiUrl(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleClear = () => {
    setForm(initialForm)
    setResult(null)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!form.body.trim()) {
      setError('Email body is required for analysis.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(buildApiUrl('/api/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: form.sender.trim(),
          subject: form.subject.trim(),
          body: form.body.trim(),
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to analyze the email.')
      }

      setResult(normalizeResult(payload))
    } catch (requestError) {
      setError(requestError.message || 'Failed to analyze the email.')
    } finally {
      setIsLoading(false)
    }
  }

  const resolvedConfig = result ? verdictConfig[result.verdict] : null

  return (
    <div className="app-shell">
      <div className="bg-orb bg-orb-left" aria-hidden="true" />
      <div className="bg-orb bg-orb-right" aria-hidden="true" />

      <header className="site-header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon" aria-hidden="true">
              SG
            </div>
            <div>
              <p className="eyebrow">AI security workstation</p>
              <h2 className="logo-text">
                Phish<span>Guard</span>
              </h2>
            </div>
          </div>
          <div className="badge">HF MODEL READY</div>
        </div>
      </header>

      <main className="container main-layout">
        <section className="hero-copy">
          <p className="hero-tag">Email Risk Triage</p>
          <h1>
            Detect <span>phishing</span> before a click becomes a breach.
          </h1>
          <p className="subtitle">
            Review suspicious messages in one place and turn raw email text into a fast verdict, a risk score,
            and the signals that triggered it.
          </p>
        </section>

        <section className="panel-grid">
          <form className="card analyzer-card" onSubmit={handleSubmit}>
            <div className="card-label">Email Input</div>

            <label className="field">
              <span>Sender Address</span>
              <input
                type="text"
                name="sender"
                value={form.sender}
                onChange={updateField}
                placeholder="e.g. support@paypa1-secure.com"
              />
            </label>

            <label className="field">
              <span>Subject Line</span>
              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={updateField}
                placeholder="e.g. Urgent: Your account has been compromised"
              />
            </label>

            <label className="field">
              <span>Email Body</span>
              <textarea
                name="body"
                value={form.body}
                onChange={updateField}
                placeholder="Paste the full email content here..."
              />
            </label>

            {error ? <div className="error-box">{error}</div> : null}

            <div className="button-row">
              <button type="button" className="btn btn-secondary" onClick={handleClear}>
                Clear
              </button>
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Analyzing...
                  </>
                ) : (
                  'Analyze Email'
                )}
              </button>
            </div>
          </form>

          <section className="card result-card">
            <div className="card-label">Threat Analysis Report</div>

            {result ? (
              <>
                <div className="verdict-bar">
                  <div className={`verdict-icon ${resolvedConfig.className}`} aria-hidden="true">
                    {resolvedConfig.icon}
                  </div>
                  <div>
                    <h3 className={`verdict-title ${resolvedConfig.className}`}>{resolvedConfig.title}</h3>
                    <p className="verdict-sub">{result.verdictReason}</p>
                  </div>
                </div>

                <div className="score-section">
                  <div className="score-label">
                    <span>Phishing Risk Score</span>
                    <span className={`score-value ${resolvedConfig.className}`}>{result.score} / 100</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className={`meter-fill ${resolvedConfig.className}`}
                      style={{ width: `${result.score}%` }}
                    />
                  </div>
                </div>

                <div className="flags-title">Detected Indicators</div>
                <div className="flags-list">
                  {result.indicators.length ? (
                    result.indicators.map((indicator, index) => {
                      const severity = ['high', 'medium', 'low'].includes(indicator?.severity)
                        ? indicator.severity
                        : 'low'

                      return (
                        <div className={`flag-item ${severity}`} key={`${indicator.text}-${index}`}>
                          <div className={`flag-dot ${severity}`} aria-hidden="true" />
                          <span>{indicator.text}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flag-item low">
                      <div className="flag-dot low" aria-hidden="true" />
                      <span>No significant threat indicators detected.</span>
                    </div>
                  )}
                </div>

                <div className="summary-box">
                  <strong>Summary:</strong> {result.summary}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Results will appear here after you submit an email.</p>
                <span>The backend is wired through the configured API base URL and the `/api/analyze` route.</span>
              </div>
            )}
          </section>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">Powered by your Hugging Face model and a local Node API bridge.</div>
      </footer>
    </div>
  )
}

export default App
