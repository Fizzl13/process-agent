const $ = (id) => document.getElementById(id);
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}
let config = { intents: [], samples: [] };

const STEP_TITLES = {
  ANALYZE_CASE: "Analyse the request",
  RETRIEVE_KNOWLEDGE: "Retrieve policies",
  POLICY_CHECK: "Check policies",
  PREPARE_RESPONSE: "Prepare the reply",
  HUMAN_REVIEW: "Human review",
  EXECUTE_ACTION: "Action",
};
const STATUS = { COMPLETED: "Done", READY: "Ready", REQUIRED: "Needs a person", BLOCKED: "Blocked", APPROVED: "Approved" };

function list(ul, items) {
  ul.replaceChildren(...items.map((t) => el("li", { textContent: t })));
}

function show(state, message) {
  $("empty").hidden = state !== "empty";
  $("error").hidden = state !== "error";
  $("result").hidden = state !== "result";
  if (state === "error") $("error").textContent = message;
}

function renderSteps(plan) {
  $("steps").replaceChildren(...plan.map((s) => el("li", { className: `step ${s.status.toLowerCase()}` },
    el("div", {},
      el("b", { textContent: STEP_TITLES[s.action] ?? s.action }),
      el("span", { textContent: s.reason })),
    el("em", { className: "badge", textContent: STATUS[s.status] ?? s.status }))));
}

let current = null;

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const go = $("go");
  go.disabled = true;
  go.textContent = "Running…";
  try {
    const res = await fetch("/api/process-case", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: $("message").value }),
    });
    const data = await res.json().catch(() => ({ error: "Unexpected answer from the server." }));
    if (!res.ok) return show("error", data.error || "Something went wrong.");
    current = data;
    const { analysis, decision } = data;
    $("caseId").textContent = data.caseId;
    $("summary").textContent = analysis.summary;
    $("intent").textContent = config.intents.find((i) => i.id === analysis.intent)?.label ?? analysis.intent;
    $("risk").textContent = decision.risk;
    $("risk").className = decision.risk.toLowerCase();
    $("confidence").textContent = `${Math.round(decision.confidence * 100)}%`;
    $("human").textContent = decision.humanRequired ? "Required" : "Not needed";
    renderSteps(data.actionPlan);
    list($("reasons"), decision.reasons);
    $("questionsBlock").hidden = !analysis.openQuestions.length;
    list($("questions"), analysis.openQuestions);
    $("reply").textContent = data.draftReply;
    $("approve").hidden = !decision.humanRequired;
    $("approved").hidden = true;
    show("result");
    if (matchMedia("(max-width: 900px)").matches) $("out").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    show("error", "Could not reach the agent. Check your connection.");
  } finally {
    go.disabled = false;
    go.textContent = "Run the agent →";
  }
});

// Only in the browser: the demo never executes anything, it just shows what
// approval would unlock.
$("approve").addEventListener("click", () => {
  if (!current) return;
  renderSteps(current.actionPlan.map((s) => (["REQUIRED", "BLOCKED"].includes(s.status) ? { ...s, status: "APPROVED" } : s)));
  $("approve").hidden = true;
  $("approved").hidden = false;
});

(async () => {
  config = await (await fetch("/api/config")).json();
  $("company").textContent = config.company;
  $("threshold").textContent = Math.round(config.confidenceThreshold * 100);
  for (const s of config.samples) {
    const b = el("button", { type: "button", textContent: `${s.language.toUpperCase()} · ${s.label}` });
    b.addEventListener("click", () => { $("message").value = s.text; $("message").focus(); });
    $("samples").append(b);
  }
})();
