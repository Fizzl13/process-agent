const $ = (id) => document.getElementById(id);
function el(tag, props = {}, ...children) {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children);
  return node;
}
let config = { intents: [], samples: [], confidenceThreshold: 0.75 };
let current = null;
let approved = false;

function list(ul, items) {
  ul.replaceChildren(...items.map((text) => el("li", { textContent: text })));
}

function show(state, message) {
  $("empty").hidden = state !== "empty";
  $("error").hidden = state !== "error";
  $("result").hidden = state !== "result";
  if (state === "error") $("error").textContent = message;
}

// Everything in the result has an English and a Dutch version, so switching
// language redraws it without asking the server again.
function renderResult() {
  if (!current) return;
  const { analysis, decision } = current;
  const nl = lang === "nl";
  $("caseId").textContent = current.caseId;
  $("summary").textContent = (nl && analysis.summaryNl) || analysis.summary;
  const intent = config.intents.find((i) => i.id === analysis.intent);
  $("intent").textContent = (nl ? intent?.labelNl : intent?.label) ?? analysis.intent;
  $("risk").textContent = t(decision.risk);
  $("risk").className = decision.risk.toLowerCase();
  $("confidence").textContent = `${Math.round(decision.confidence * 100)}%`;
  $("human").textContent = decision.humanRequired ? t("required") : t("notNeeded");
  const plan = approved
    ? current.actionPlan.map((s) => (["REQUIRED", "BLOCKED"].includes(s.status) ? { ...s, status: "APPROVED" } : s))
    : current.actionPlan;
  $("steps").replaceChildren(...plan.map((s) => el("li", { className: `step ${s.status.toLowerCase()}` },
    el("div", {},
      el("b", { textContent: t(s.action) }),
      el("span", { textContent: (nl && s.reasonNl) || s.reason })),
    el("em", { className: "badge", textContent: t(s.status) }))));
  list($("reasons"), (nl && decision.reasonsNl) || decision.reasons);
  $("questionsBlock").hidden = !analysis.openQuestions.length;
  list($("questions"), analysis.openQuestions);
  $("reply").textContent = current.draftReply;
  $("approve").hidden = !decision.humanRequired || approved;
  $("approved").hidden = !approved;
}

function renderStatic() {
  $("ruleReview").textContent = t("ruleReview")(Math.round(config.confidenceThreshold * 100));
  $("samples").replaceChildren(...config.samples.map((s) => {
    const b = el("button", { type: "button", textContent: `${s.language.toUpperCase()} · ${s.label}` });
    b.addEventListener("click", () => { $("message").value = s.text; $("message").focus(); });
    return b;
  }));
  if (!$("go").disabled) $("go").textContent = t("run");
  renderResult();
}

$("form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const go = $("go");
  go.disabled = true;
  go.textContent = t("running");
  try {
    const res = await fetch("/api/process-case", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: $("message").value }),
    });
    const data = await res.json().catch(() => ({ error: t("unexpected") }));
    if (!res.ok) return show("error", data.error || t("failed"));
    current = data;
    approved = false;
    renderResult();
    show("result");
    if (matchMedia("(max-width: 900px)").matches) $("out").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    show("error", t("offline"));
  } finally {
    go.disabled = false;
    go.textContent = t("run");
  }
});

// Only in the browser: the demo never executes anything, it just shows what
// approval would unlock.
$("approve").addEventListener("click", () => {
  approved = true;
  renderResult();
});

document.addEventListener("langchange", renderStatic);
applyLang();

(async () => {
  config = await (await fetch("/api/config")).json();
  $("company").textContent = config.company;
  renderStatic();
})();
