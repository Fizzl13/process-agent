# Process Agent

AI reads the customer case, **fixed rules decide what runs**. Paste a customer message: Claude works out what the customer wants, which policies apply and which actions would solve it. Then deterministic rules, not the AI, set the risk and decide what happens:

| Risk | Actions | What happens |
| --- | --- | --- |
| LOW | send information, password reset link, log a complaint | prepared automatically |
| MEDIUM | credit a free day, change an address, offer a discount | a person approves first |
| HIGH | refund, cancel, change a subscription | blocked until a person approves |

Also: if the AI is less than 75% sure, or the customer is upset, a person reviews the case. A safety rule adds a refund or cancellation that the message plainly asks for, even if the analysis missed it. The demo never executes anything; "approve" only shows what approval would unlock.

The demo uses **Northwind Daily**, the same made-up news subscription as [ReplyDesk](https://github.com/Fizzl13/replydesk). Its policies and actions live in [`src/company.js`](src/company.js), and the rules in [`src/decision.js`](src/decision.js).

Built by Frits ([fizzl.eu](https://fizzl.eu/)) with Claude.

## How it's built

- **Analysis:** Claude with structured output (intent, language, sentiment, urgency, policies, proposed actions from a fixed list, confidence, open questions, a draft reply).
- **Decision:** plain code. The risk of each action is fixed in code; the model can only pick from the list. Every reason and step text comes from the rules, never from the model.
- **Guard rails:** the system prompt is fixed on the server, and the customer message is wrapped as data. The browser can't send its own prompt.
- **Limits:** 10 cases per visitor per hour and 300 per day. Messages are capped at 4,000 characters.

## API

`POST /api/process-case` with `{ "message": "…" }` returns `{ caseId, analysis, decision: { risk, confidence, humanRequired, reasons }, actionPlan: [{ action, status, reason }], draftReply, executed: false }`.

The widget on fizzl.eu uses the same API; CORS allows the fizzl.eu sites only.

## Run it

```bash
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env   # never commit this
npm run dev                                  # http://localhost:3000
npm test                                     # no API key needed
```

Deploy on Render with the included `render.yaml` (Blueprint); set `ANTHROPIC_API_KEY` in Render only.
