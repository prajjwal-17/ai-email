# Test Cases

## Manual Test Case Table

Use this table while testing the application in the browser and through the backend API.

| Test ID | Module | Input | Expected Output | Actual Output | Status |
| --- | --- | --- | --- | --- | --- |
| TC-001 | Frontend form | Empty body | Error message should appear | Client-side validation exists in source; live browser capture pending | Partial |
| TC-002 | Frontend form | Valid phishing email | Request should be submitted | Frontend is wired to `POST /api/analyze` | Pass |
| TC-003 | Backend API | `GET /api/health` | JSON success response | `{"ok":true,"service":"phishguard-backend"}` | Pass |
| TC-004 | Backend API | Invalid JSON on `/api/analyze` | Error response | `{"error":"Request body must be valid JSON."}` | Pass |
| TC-005 | Backend API | Missing `body` field | Validation error | `{"error":"Email body is required for analysis."}` | Pass |
| TC-006 | Model integration | Strong phishing sample | `PHISHING` | `PHISHING`, score `88` | Pass |
| TC-007 | Model integration | Safe internal email | `SAFE` | `SAFE`, score `18` | Pass |
| TC-008 | Model integration | Mixed-risk email | `SUSPICIOUS` or `PHISHING` | `SAFE`, score `18` | Fail |
| TC-009 | UI rendering | Valid result payload | Score, verdict, indicators, summary visible | Source supports all result fields; visual evidence capture pending | Partial |
| TC-010 | UI rendering | Clear form action | Inputs and result reset | Verified in source logic | Pass |

## Ready-to-Use Test Inputs

### Phishing sample

```text
Sender: security@paypa1-alerts.com
Subject: Urgent: Verify your account now

Dear customer,

We detected unusual activity on your PayPal account. Your access will be limited within 24 hours unless you confirm your identity immediately.

Click here to verify:
http://paypal-account-verify-login-security.com

Failure to act may result in permanent suspension.

Thank you,
Security Team
```

### Suspicious sample

```text
Sender: hr@company-careers.net
Subject: Updated payroll document

Hello,

Please review the attached payroll update before end of day. If you cannot open the attachment, log in using the secure employee portal below and confirm your credentials.

Portal:
http://employee-payroll-review.net

Regards,
HR Support
```

### Safe sample

```text
Sender: manager@yourcompany.com
Subject: Team meeting rescheduled

Hi team,

The project review meeting has been moved to 3:30 PM today in Conference Room B. Please bring your sprint notes and blocker list.

Thanks,
Aman
```

## Evidence Capture Checklist

- Capture screenshot of empty form
- Capture screenshot of validation error
- Capture screenshot of phishing result
- Capture screenshot of safe result
- Capture screenshot of suspicious result
- Capture terminal output of backend health check
- Capture terminal output of analyze endpoint response
