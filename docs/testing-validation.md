# Testing and Validation Results

## Objective

This document records the testing and validation approach for the PhishGuard phishing email detection system. The goal is to verify that the frontend, backend, and model integration behave correctly using only free tools and reproducible manual/API checks.

## Scope

The following modules are covered:

- React frontend user interface
- Node backend API bridge
- Hugging Face Space integration
- End-to-end phishing email analysis flow
- Basic error handling and input validation

## Free Resources Used

- Local browser testing with the Vite development server
- Node.js runtime
- PowerShell for API validation
- Hugging Face Space free access or free-tier token
- Markdown documentation for evidence capture

## Test Environment

| Item | Value |
| --- | --- |
| Frontend | React + Vite |
| Backend | Node.js HTTP server |
| Model host | Hugging Face Gradio Space |
| API route | `POST /api/analyze` |
| Health route | `GET /api/health` |
| Local backend port | `8787` |
| Local frontend port | Vite default dev server |

## Test Strategy

Testing is divided into four categories:

1. Unit-level behavior checks
2. Backend API validation
3. Frontend functional testing
4. End-to-end model response validation

## Executed Validation Summary

The table below reflects the checks completed during setup.

| Test ID | Test Description | Expected Result | Actual Result | Status |
| --- | --- | --- | --- | --- |
| TV-001 | Frontend production build | Frontend builds successfully without errors | `npm run build` completed successfully | Pass |
| TV-002 | Backend health endpoint | `/api/health` returns JSON success response | Returned `{"ok":true,"service":"phishguard-backend"}` | Pass |
| TV-003 | Frontend to backend route design | Frontend submits to `/api/analyze` | Verified in source code and Vite proxy config | Pass |
| TV-004 | Backend Hugging Face adapter setup | Backend uses `@gradio/client` and `/predict` | Verified in backend source code | Pass |
| TV-005 | Invalid JSON request handling | Backend should reject malformed JSON | Returned `{"error":"Request body must be valid JSON."}` | Pass |
| TV-006 | Missing body validation | Backend should reject empty email body | Returned `{"error":"Email body is required for analysis."}` | Pass |
| TV-007 | Real phishing sample inference | Model should return a phishing-style classification payload | Returned `PHISHING` with `risk_score: 88` | Pass |
| TV-008 | Real safe sample inference | Model should return a safe-style classification payload | Returned `SAFE` with `risk_score: 18` | Pass |
| TV-009 | Real suspicious sample inference | Model should return suspicious or phishing classification | Returned `SAFE` with `risk_score: 18` | Fail |

## Detailed Functional Validation

### 1. Frontend Validation

Frontend validation confirms that the user interface can collect the required data and submit it to the backend.

Validated items:

- Sender field is available
- Subject field is available
- Email body field is available
- Analyze button submits data
- Clear button resets the form
- Error message appears when body is empty
- Threat report panel displays model response

Expected frontend behavior:

- The user enters email content
- The frontend sends a JSON payload to `POST /api/analyze`
- The interface displays the verdict, risk score, indicators, and summary

### 2. Backend Validation

Backend validation confirms that the API bridge can receive requests, validate input, and attempt to query the Hugging Face Space.

Validated items:

- Backend starts successfully on port `8787`
- `/api/health` responds correctly
- `/api/analyze` validates missing `body`
- Backend converts frontend email fields into one `text` prompt for the Hugging Face Space
- Backend calls Gradio `predict("/predict", { text })`

### 3. Integration Validation

Integration validation checks whether the frontend contract and backend contract are aligned.

Confirmed integration points:

- Frontend fetch path uses `/api/analyze`
- Vite proxy forwards `/api/*` to `http://localhost:8787`
- Backend returns normalized fields:
  - `risk_score`
  - `verdict`
  - `verdict_reason`
  - `indicators`
  - `summary`

### 4. Model Validation

Model validation was executed through the live backend route after confirming that the Hugging Face Space was reachable.

Suggested live validation test cases:

| Input Type | Example | Expected Classification |
| --- | --- | --- |
| Clear phishing email | Fake login link, urgency, suspension warning | `PHISHING` |
| Safe internal email | Team meeting update | `SAFE` |
| Suspicious mixed email | Payroll or document verification request with external link | `SUSPICIOUS` or `PHISHING` |

### Live test results

| Sample | Expected | Actual | Result |
| --- | --- | --- | --- |
| Fake account verification email with malicious link | `PHISHING` | `PHISHING` | Correct |
| Normal internal meeting email | `SAFE` | `SAFE` | Correct |
| Payroll review email with external credential request | `SUSPICIOUS` or `PHISHING` | `SAFE` | Incorrect |

## Sample API Test Commands

### Health check

```powershell
Invoke-RestMethod http://localhost:8787/api/health
```

### Analyze endpoint test

```powershell
$body = @{
  sender = "security@paypa1-alerts.com"
  subject = "Urgent account verification"
  body = "Click this link immediately to verify your account or it will be suspended."
} | ConvertTo-Json

Invoke-RestMethod http://localhost:8787/api/analyze -Method Post -ContentType "application/json" -Body $body
```

## Validation Metrics to Record

Once live predictions are working, record the following:

- Total test emails executed
- Number of phishing emails correctly flagged
- Number of safe emails correctly flagged
- Number of suspicious emails flagged
- False positives
- False negatives
- Average response time

## Example Result Summary Format

Current small-sample result summary:

| Metric | Value |
| --- | --- |
| Total live classification test cases | 3 |
| Correct predictions | 2 |
| Incorrect predictions | 1 |
| Observed small-sample accuracy | 66.7% |
| False positives | 0 |
| False negatives | 1 |
| Average response time | Not formally measured |

Suggested final report format for a larger dataset:

| Metric | Value |
| --- | --- |
| Total test cases | 10 |
| Correct predictions | 8 |
| Incorrect predictions | 2 |
| Accuracy | 80% |
| False positives | 1 |
| False negatives | 1 |
| Average response time | 2.3 seconds |

## Current Limitations

- Current measured accuracy is based on only three manually selected samples
- The suspicious payroll-style sample was misclassified as safe, which indicates false-negative risk
- Average response time and larger-dataset accuracy still need broader testing

## Conclusion

The application frontend and backend are functioning correctly at the integration level, and live model testing is now operational. Initial results show that the system can correctly identify obvious phishing and safe emails, but it also missed a suspicious credential-style email. This means testing is substantially complete for setup validation, while broader dataset evaluation is still needed before making strong performance claims.
