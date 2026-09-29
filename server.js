import { createApp } from "./src/app.js";
import { createAgent } from "./src/agent.js";

if (!process.env.ANTHROPIC_API_KEY) console.warn("ANTHROPIC_API_KEY is not set: cases will fail.");

const port = Number(process.env.PORT) || 3000;
createApp({ processCase: createAgent() }).listen(port, () => console.log(`Process Agent on http://localhost:${port}`));
