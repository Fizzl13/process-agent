// The deterministic half of the agent. Claude analyses the case and proposes
// actions; these rules decide what may run, what a person must approve and
// what is blocked. Every reason text comes from here, never from the model.

import { ACTIONS, POLICIES } from "./company.js";

export const CONFIDENCE_THRESHOLD = 0.75;
const RANK = { LOW: 0, MEDIUM: 1, HIGH: 2 };

// A safety net under the model: if the message plainly asks for money back, a
// cancellation or a subscription change, that action is on the table even if
// the analysis missed it.
const SAFETY_RULES = [
  { action: "ISSUE_REFUND", pattern: /refund|money back|charged twice|double charge|terugbetal|terugstort|geld terug|dubbel afgeschreven|twee keer afgeschreven/i },
  { action: "CANCEL_SUBSCRIPTION", pattern: /cancel|opzeg|stop (my|the) subscription|abonnement stop/i },
  { action: "CHANGE_SUBSCRIPTION", pattern: /upgrade|downgrade|switch (to|my) (plan|subscription)|abonnement (wijzig|aanpass|omzett)/i },
];

const STEP = {
  analyzed: "Intent, language and tone identified.",
  retrieved: (n) => `${n} matching ${n === 1 ? "policy" : "policies"} retrieved from the knowledge base.`,
  policyOk: "The proposed actions fit the policies.",
  policyHuman: "Money or a subscription is involved: a person checks this against the policies.",
  prepared: "Draft reply prepared for review.",
  reviewNeeded: "A person must approve before anything is done.",
  reviewSkipped: "Not needed: low risk and high confidence.",
  ready: (label) => `${label}: can be prepared automatically.`,
  approval: (label) => `${label}: waits for approval.`,
  blocked: (label) => `${label}: blocked until a person approves.`,
};

export function decide(analysis, message) {
  const reasons = [];
  const proposed = [...new Set(analysis.proposed_actions.filter((a) => ACTIONS[a]))];
  for (const rule of SAFETY_RULES) {
    if (rule.pattern.test(message) && !proposed.includes(rule.action)) {
      proposed.push(rule.action);
      reasons.push(`Safety rule: the message mentions it, so "${ACTIONS[rule.action].label}" is added.`);
    }
  }

  const risk = proposed.reduce((max, a) => (RANK[ACTIONS[a].risk] > RANK[max] ? ACTIONS[a].risk : max), "LOW");
  const confidence = Math.min(1, Math.max(0, Number(analysis.confidence) || 0));

  if (risk === "HIGH") reasons.push("High risk: money or a subscription is involved, so execution is blocked until a person approves.");
  if (risk === "MEDIUM") reasons.push("Medium risk: the action changes a customer account, so a person approves it first.");
  if (confidence < CONFIDENCE_THRESHOLD) reasons.push(`The AI is not sure enough (${Math.round(confidence * 100)}% < ${CONFIDENCE_THRESHOLD * 100}%), so a person reviews the case.`);
  if (analysis.sentiment === "angry") reasons.push("The customer is upset: a person reads the reply before it goes out.");
  const humanRequired = risk !== "LOW" || confidence < CONFIDENCE_THRESHOLD || analysis.sentiment === "angry";
  if (!humanRequired) reasons.push("Low risk and high confidence: the reply and low-risk actions can be prepared automatically.");

  const policies = POLICIES.filter((p) => analysis.policies.includes(p.id));
  const actionPlan = [
    { action: "ANALYZE_CASE", status: "COMPLETED", reason: STEP.analyzed },
    { action: "RETRIEVE_KNOWLEDGE", status: "COMPLETED", reason: STEP.retrieved(policies.length) },
    risk === "HIGH"
      ? { action: "POLICY_CHECK", status: "REQUIRED", risk, reason: STEP.policyHuman }
      : { action: "POLICY_CHECK", status: "COMPLETED", risk, reason: STEP.policyOk },
    { action: "PREPARE_RESPONSE", status: "COMPLETED", reason: STEP.prepared },
    humanRequired
      ? { action: "HUMAN_REVIEW", status: "REQUIRED", reason: STEP.reviewNeeded }
      : { action: "HUMAN_REVIEW", status: "COMPLETED", reason: STEP.reviewSkipped },
    ...proposed.map((id) => {
      const { risk: r, label } = ACTIONS[id];
      if (r === "HIGH") return { action: "EXECUTE_ACTION", target: id, risk: r, status: "BLOCKED", reason: STEP.blocked(label) };
      if (r === "MEDIUM" || humanRequired) return { action: "EXECUTE_ACTION", target: id, risk: r, status: "REQUIRED", reason: STEP.approval(label) };
      return { action: "EXECUTE_ACTION", target: id, risk: r, status: "READY", reason: STEP.ready(label) };
    }),
  ];

  return { decision: { risk, confidence, humanRequired, reasons }, policies, actionPlan };
}
