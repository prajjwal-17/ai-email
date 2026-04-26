# Risk and Threat Analysis

## Objective

This document identifies the main security, reliability, and operational risks in the PhishGuard phishing email detection system. The purpose is to understand where the system can fail, how an attacker or misuse scenario could affect it, and which mitigations are already present or recommended.

## System Context

PhishGuard has three major layers:

- React frontend for user input and result display
- Node backend that exposes `/api/analyze`
- Hugging Face Gradio Space used as the ML classification service

Users submit sender, subject, and email body text through the frontend. The backend combines those inputs into a single `text` prompt and forwards it to the deployed model. The model response is then normalized and shown back in the interface as a verdict, score, indicators, and summary.

## Assets to Protect

The following assets are important:

- User-submitted email content
- Hugging Face API token
- Prediction integrity
- Backend availability
- Correct classification results
- Trustworthiness of the report shown to the end user

## Threat Categories

This project is most exposed to the following risk categories:

1. Model misclassification risk
2. Sensitive data exposure risk
3. Availability and service dependency risk
4. Input abuse and malformed request risk
5. Trust and interpretation risk
6. Token leakage and configuration risk

## Risk Rating Scale

Likelihood scale:

- Low
- Medium
- High

Impact scale:

- Low
- Medium
- High

## Risk Matrix

| Risk ID | Threat | Affected Area | Likelihood | Impact | Risk Level |
| --- | --- | --- | --- | --- | --- |
| R-01 | False negative on phishing email | Model output | High | High | Critical |
| R-02 | False positive on legitimate email | Model output | Medium | Medium | Moderate |
| R-03 | Hugging Face Space downtime or inaccessibility | Backend integration | Medium | High | High |
| R-04 | API token leakage | Backend configuration | Medium | High | High |
| R-05 | Sensitive email content sent to external model host | Privacy and compliance | Medium | High | High |
| R-06 | Malformed or abusive input requests | Backend API | Medium | Medium | Moderate |
| R-07 | Overtrust in AI-generated verdict | User decision-making | High | High | Critical |
| R-08 | Incomplete or ambiguous model explanations | Result interpretation | Medium | Medium | Moderate |
| R-09 | Excessive request volume causing slowdown | Backend availability | Low | Medium | Low to Moderate |
| R-10 | Hardcoded assumptions in output normalization | Backend response parsing | Medium | Medium | Moderate |

## Detailed Threat Analysis

### R-01: False Negative on Phishing Email

Description:

The system may classify a phishing email as safe. This is currently the most serious practical risk because it can directly lead the user to trust a malicious message.

Observed evidence:

- During testing, a suspicious payroll-style email with a credential request and external link was classified as `SAFE`

Impact:

- User may click a malicious link
- Credential theft may occur
- Project trustworthiness decreases

Current mitigation:

- The UI displays a score, verdict, indicators, and summary instead of only one label

Recommended mitigation:

- Add a visible disclaimer that the result is decision support, not a guarantee
- Expand the validation dataset with more real phishing variants
- Improve prompt/model behavior if the Space supports tuning or better output formatting
- Treat external-link plus urgency patterns more cautiously in backend post-processing if appropriate

### R-02: False Positive on Legitimate Email

Description:

A legitimate email may be flagged as suspicious or phishing.

Impact:

- User inconvenience
- Delayed communication
- Reduced confidence in the system

Recommended mitigation:

- Provide a short explanation for why the email was flagged
- Encourage manual review for borderline scores
- Keep a `SUSPICIOUS` middle state instead of forcing only safe/phishing decisions

### R-03: Hugging Face Space Downtime or Inaccessibility

Description:

The backend depends on external availability of the Hugging Face Space. If the Space is unavailable, results cannot be generated.

Impact:

- Service becomes unavailable
- User receives errors instead of predictions

Current mitigation:

- Backend returns explicit error messages when connection fails

Recommended mitigation:

- Add friendly fallback messaging in the frontend
- Log outage frequency
- Add retry logic with short limits
- Keep a simple local fallback classifier if needed in future phases

### R-04: API Token Leakage

Description:

If the Hugging Face token is exposed in frontend code, public repositories, screenshots, or logs, unauthorized users may access the model account.

Impact:

- Resource misuse
- Quota exhaustion
- Unauthorized access to private Spaces

Current mitigation:

- Token is stored in backend environment variables instead of frontend code
- `.gitignore` excludes `backend/.env`

Recommended mitigation:

- Never commit `.env`
- Rotate token if exposure is suspected
- Use the minimum required token permissions

### R-05: Sensitive Email Content Sent to External Model Host

Description:

User-submitted email text is transmitted to an external hosted model. If the content contains personal or confidential information, this creates a privacy risk.

Impact:

- Exposure of internal or personal information
- Compliance concerns depending on deployment context

Recommended mitigation:

- Warn users not to paste highly confidential content unless approved
- Mask sensitive data before submission where possible
- Document that inference is handled through a third-party hosted model

### R-06: Malformed or Abusive Input Requests

Description:

Attackers or testers may submit invalid JSON, empty payloads, or overly large payloads.

Current mitigation:

- Invalid JSON is rejected
- Empty body is rejected
- Request body size is capped to about 1 MB

Impact:

- Resource waste
- Potential service instability under abuse

Recommended mitigation:

- Add rate limiting in future versions
- Add request logging for repeated abuse
- Add clearer frontend validation before request submission

### R-07: Overtrust in AI-Generated Verdict

Description:

Users may treat the AI result as final truth even when the model is wrong.

Impact:

- False sense of safety
- High business/security impact when false negatives occur

Recommended mitigation:

- Add a prominent note such as "Use as decision support only"
- Encourage manual verification for links, attachments, and login requests
- Highlight uncertainty for medium-confidence outputs

### R-08: Incomplete or Ambiguous Model Explanations

Description:

The current model output may be minimal, for example returning only "Safe Email" or "Phishing Email" without a detailed explanation.

Impact:

- Weak interpretability
- Limited educational value for users
- Harder to justify decisions in reports

Recommended mitigation:

- Improve output format at the model level
- Add richer explanation templates in backend normalization
- Record examples where the model explanation is too shallow

### R-09: Excessive Request Volume

Description:

If many requests arrive in a short period, a free-tier or lightweight backend may slow down or fail.

Impact:

- Slower responses
- Denial of service at small scale

Recommended mitigation:

- Add basic rate limiting later
- Cache repeated identical requests if needed
- Monitor average response time during testing

### R-10: Hardcoded Output Normalization Assumptions

Description:

The backend currently maps output text into verdicts using simple string matching rules such as checking for "phishing" or "safe".

Impact:

- Misclassification due to output wording changes
- Fragile integration if the Space response format evolves

Recommended mitigation:

- Prefer structured model output where possible
- Add tests for multiple response formats
- Keep normalization logic documented and version-controlled

## Existing Security Controls

The current project already includes some helpful controls:

- Backend-only storage of Hugging Face token
- Input validation for invalid JSON and empty email body
- Request size guard in backend request handling
- Separation of frontend and backend responsibilities
- Normalization of model output into predictable UI fields

## Residual Risk Summary

Even after current mitigations, the most important residual risks are:

- False negatives on realistic phishing emails
- Overtrust in AI classification
- Privacy concerns when sending email content to an external model
- Dependence on third-party uptime

These residual risks should be clearly stated during demonstrations or in the project report.

## Recommended Priority Actions

The highest-value next actions are:

1. Add a visible decision-support disclaimer in the frontend
2. Expand testing with more phishing and suspicious samples
3. Improve explanation quality from the model or backend normalization
4. Add simple request logging and basic monitoring
5. Add rate limiting if the application is exposed beyond local use

## Conclusion

The main security challenge in this project is not only technical attack resistance, but also the correctness and trustworthiness of the classification result. The system is reasonably structured for a student or prototype deployment, but it still carries meaningful false-negative, privacy, and dependency risks. These should be documented honestly and reduced through broader testing, better explanation quality, and clear user guidance.
