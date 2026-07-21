# YojnaDost — AI-Powered Government Scheme Navigator

An agentic AI system that conversationally matches Indian citizens to government welfare schemes they're eligible for, and proactively notifies them when new matching schemes are added — built with **n8n**, **Groq (Llama 3.3 70B)**, **Google Sheets**, and **Telegram**.

Millions of eligible citizens don't know which government welfare schemes they qualify for, since information is scattered across portals in complex bureaucratic language. YojnaDost solves this with a two-part agentic pipeline: a conversational agent that collects a user's profile and matches them to real schemes, and a background broadcaster that watches for new schemes and alerts already-registered users the moment they qualify.

**Sustainable Development Goals addressed:** SDG 1 (No Poverty), SDG 10 (Reduced Inequalities), SDG 16 (Peace, Justice & Strong Institutions)

---

## How it works

### 1. Conversational Scheme Matching (`main-conversation-workflow.json`)

```
Telegram message
  → extract chat_id + text
  → fetch conversation history from Google Sheets
  → check if this user already has a finalized match (and isn't asking to restart)
  → LLM Agent Brain (Groq) collects age, income, occupation, state, caste
    category, gender, disability status, and notification preference
    turn-by-turn, replying in strict JSON
  → once complete, a separate Matching Agent (Groq) checks the profile
    against every scheme's real eligibility criteria and explains the
    matches in plain language, including how to apply
  → result sent back via Telegram, and logged to Google Sheets
```

Two safeguards keep this reliable:
- **Strict JSON contracts** between every step (see `prompt_conversation.txt` / `prompt_matching.txt`), so the system never depends on free-form text parsing
- **An "already matched" guard** (`CheckAlreadyMatched`) that stops the bot from re-running the matching LLM (and risking a hallucinated answer) on every follow-up message once a user's profile is finalized — instead it points back to the original result, and lets the user type "restart" to re-collect their details

### 2. Notification Broadcaster (`notification-broadcaster-workflow.json`)

```
New row added to the Schemes sheet
  → fetch all users who opted in to notifications
  → for each user, run a fast, deterministic JS eligibility check
    (is_eligible.js) — no LLM call per user, so it's cheap and instant
  → for eligible users only, an LLM (Groq) drafts a short, friendly
    alert once per new scheme
  → alert sent via Telegram, and logged to a NotificationLog sheet
    to prevent duplicate sends
```

This runs entirely in the background — add a new scheme to the `Schemes` sheet, and eligible users are notified automatically without anyone needing to trigger anything.

---

## Why an agentic pipeline instead of a single LLM call

- **Rule-based eligibility checks for anything demo-critical or run-at-scale** (`is_eligible.js`) — deterministic and free, so the broadcaster can safely evaluate every user against every new scheme without LLM cost or hallucination risk
- **LLM reasoning only where natural language actually helps** — collecting a profile conversationally, and explaining *why* someone matches in plain language
- **Explicit JSON contracts** between every agent step, so failures are caught and handled (a malformed LLM response falls back to a polite retry instead of crashing the workflow)

---

## Tech Stack

| Component | Role |
|---|---|
| [n8n](https://n8n.io) | Workflow orchestration (self-hosted, free) |
| [Groq API](https://console.groq.com) — Llama 3.3 70B | Conversational reasoning, scheme matching, notification drafting |
| Google Sheets | Lightweight database — schemes, user profiles, conversation history, notification log |
| Telegram Bot API | User-facing chat interface |

---

## Repository Structure

```
YojnaDost/
├── README.md
├── workflows/
│   ├── main-conversation-workflow.json
│   └── notification-broadcaster-workflow.json
├── agent-logic/
│   ├── prompt_conversation.txt      — system prompt for profile collection
│   ├── prompt_matching.txt          — system prompt for scheme matching
│   ├── prompt_notification.txt      — system prompt for notification alerts
│   ├── extract_json.js              — parses/repairs LLM JSON output
│   ├── is_eligible.js               — deterministic eligibility rules
│   ├── mock_schemes.json            — sample scheme data for testing
│   └── mock_profiles.json           — sample user profiles for testing
└── docs/                            — (optional) Lean Canvas, project guides, etc.
```

---

## Setup

You'll need your own free credentials for each service below — never use anyone else's API keys or tokens.

1. **Groq API key** — sign up free at [console.groq.com](https://console.groq.com) → API Keys → Create API Key
2. **Telegram bot token** — message [@BotFather](https://t.me/BotFather) on Telegram → `/newbot` → follow the prompts
3. **Google Sheet** — create a sheet with four tabs matching this schema:

   **`Schemes`**: `scheme_id`, `scheme_name`, `category`, `description`, `min_age`, `max_age`, `income_cap_annual`, `occupation_eligible`, `caste_category`, `gender_eligible`, `state_eligible`, `disability_required`, `benefits`, `application_process`, `application_link`, `date_added`

   **`UserProfiles`**: `chat_id`, `age`, `income`, `occupation`, `state`, `caste_category`, `gender`, `disability`, `opt_in_notifications`, `last_updated`

   **`ConversationHistory`**: `chat_id`, `role`, `message`, `timestamp`, `status`

   **`NotificationLog`**: `log_id`, `chat_id`, `scheme_id`, `sent_timestamp`

4. **n8n** — self-host free via Docker:
   ```bash
   docker run -it --rm -p 5678:5678 -v n8n_data:/home/node/.n8n n8nio/n8n
   ```
   or use n8n Cloud's free trial.
5. Import both workflow JSON files from `workflows/` into n8n.
6. In each imported workflow, replace:
   - `YOUR_GROQ_API_KEY_HERE` in every HTTP Request node's Authorization header with your real Groq key
   - `YOUR_SHEET_URL_HERE` with your real Google Sheet URL
   - The Telegram and Google Sheets credentials with your own connected accounts
7. Populate the `Schemes` tab with real scheme data (a good starting source is [myscheme.gov.in](https://www.myscheme.gov.in)).
8. Activate both workflows in n8n.

---

## Known Limitations

- Follow-up questions after a match is finalized get a static response rather than a dynamic answer, to avoid the LLM hallucinating scheme details on repeated calls — users can type "restart" to re-collect their profile and get matched again.
- Currently supports English-language conversations only.
- Scheme data is manually curated rather than pulled from a live government API/feed.

## Future Work

- Multilingual support for regional languages
- WhatsApp integration alongside Telegram
- Scoped follow-up answering for a single already-matched scheme, without re-running full matching logic

---

## Live Links

- **GitHub Repository:** [INSERT LINK HERE]
- **Live Telegram Bot:** [INSERT LINK HERE, e.g. https://t.me/YojnaDostBot]
