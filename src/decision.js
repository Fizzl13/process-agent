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

// Every text in English and Dutch: the page shows the visitor's language, the
// fizzl.eu widget reads the English one.
const STEP = {
  analyzed: { en: "Intent, language and tone identified.", nl: "Vraag, taal en toon herkend." },
  retrieved: (n) => ({
    en: `${n} matching ${n === 1 ? "policy" : "policies"} retrieved from the knowledge base.`,
    nl: `${n} passende ${n === 1 ? "beleidsregel" : "beleidsregels"} uit de kennisbank gehaald.`,
  }),
  policyOk: { en: "The proposed actions fit the policies.", nl: "De voorgestelde acties passen binnen het beleid." },
  policyHuman: { en: "Money or a subscription is involved: a person checks this against the policies.", nl: "Er gaat het om geld of een abonnement: een mens toetst dit aan het beleid." },
  prepared: { en: "Draft reply prepared for review.", nl: "Conceptantwoord klaargezet ter controle." },
  reviewNeeded: { en: "A person must approve before anything is done.", nl: "Een mens moet akkoord geven voordat er iets gebeurt." },
  reviewSkipped: { en: "Not needed: low risk and high confidence.", nl: "Niet nodig: laag risico en hoge zekerheid." },
  ready: (a) => ({ en: `${a.label}: can be prepared automatically.`, nl: `${a.labelNl}: kan automatisch worden klaargezet.` }),
  approval: (a) => ({ en: `${a.label}: waits for approval.`, nl: `${a.labelNl}: wacht op akkoord.` }),
  blocked: (a) => ({ en: `${a.label}: blocked until a person approves.`, nl: `${a.labelNl}: geblokkeerd tot een mens akkoord geeft.` }),
};

const REASON = {
  safety: (a) => ({ en: `Safety rule: the message mentions it, so "${a.label}" is added.`, nl: `Veiligheidsregel: het bericht noemt het, dus "${a.labelNl}" is toegevoegd.` }),
  high: { en: "High risk: money or a subscription is involved, so execution is blocked until a person approves.", nl: "Hoog risico: er gaat het om geld of een abonnement, dus uitvoeren is geblokkeerd tot een mens akkoord geeft." },
  medium: { en: "Medium risk: the action changes a customer account, so a person approves it first.", nl: "Gemiddeld risico: de actie wijzigt een klantaccount, dus een mens geeft eerst akkoord." },
  unsure: (pct) => ({ en: `The AI is not sure enough (${pct}% < ${CONFIDENCE_THRESHOLD * 100}%), so a person reviews the case.`, nl: `De AI is niet zeker genoeg (${pct}% < ${CONFIDENCE_THRESHOLD * 100}%), dus een mens bekijkt de zaak.` }),
  angry: { en: "The customer is upset: a person reads the reply before it goes out.", nl: "De klant is boos: een mens leest het antwoord voordat het verstuurd wordt." },
  auto: { en: "Low risk and high confidence: the reply and low-risk actions can be prepared automatically.", nl: "Laag risico en hoge zekerheid: het antwoord en acties met laag risico kunnen automatisch worden klaargezet." },
};

const step = (fields, text) => ({ ...fields, reason: text.en, reasonNl: text.nl });

export function decide(analysis, message) {
  const reasons = [];
  const proposed = [...new Set(analysis.proposed_actions.filter((a) => ACTIONS[a]))];
  for (const rule of SAFETY_RULES) {
    if (rule.pattern.test(message) && !proposed.includes(rule.action)) {
      proposed.push(rule.action);
      reasons.push(REASON.safety(ACTIONS[rule.action]));
    }
  }

  const risk = proposed.reduce((max, a) => (RANK[ACTIONS[a].risk] > RANK[max] ? ACTIONS[a].risk : max), "LOW");
  const confidence = Math.min(1, Math.max(0, Number(analysis.confidence) || 0));

  if (risk === "HIGH") reasons.push(REASON.high);
  if (risk === "MEDIUM") reasons.push(REASON.medium);
  if (confidence < CONFIDENCE_THRESHOLD) reasons.push(REASON.unsure(Math.round(confidence * 100)));
  if (analysis.sentiment === "angry") reasons.push(REASON.angry);
  const humanRequired = risk !== "LOW" || confidence < CONFIDENCE_THRESHOLD || analysis.sentiment === "angry";
  if (!humanRequired) reasons.push(REASON.auto);

  const policies = POLICIES.filter((p) => analysis.policies.includes(p.id));
  const actionPlan = [
    step({ action: "ANALYZE_CASE", status: "COMPLETED" }, STEP.analyzed),
    step({ action: "RETRIEVE_KNOWLEDGE", status: "COMPLETED" }, STEP.retrieved(policies.length)),
    risk === "HIGH"
      ? step({ action: "POLICY_CHECK", status: "REQUIRED", risk }, STEP.policyHuman)
      : step({ action: "POLICY_CHECK", status: "COMPLETED", risk }, STEP.policyOk),
    step({ action: "PREPARE_RESPONSE", status: "COMPLETED" }, STEP.prepared),
    humanRequired
      ? step({ action: "HUMAN_REVIEW", status: "REQUIRED" }, STEP.reviewNeeded)
      : step({ action: "HUMAN_REVIEW", status: "COMPLETED" }, STEP.reviewSkipped),
    ...proposed.map((id) => {
      const a = ACTIONS[id];
      const base = { action: "EXECUTE_ACTION", target: id, risk: a.risk };
      if (a.risk === "HIGH") return step({ ...base, status: "BLOCKED" }, STEP.blocked(a));
      if (a.risk === "MEDIUM" || humanRequired) return step({ ...base, status: "REQUIRED" }, STEP.approval(a));
      return step({ ...base, status: "READY" }, STEP.ready(a));
    }),
  ];

  return {
    decision: { risk, confidence, humanRequired, reasons: reasons.map((r) => r.en), reasonsNl: reasons.map((r) => r.nl) },
    policies,
    actionPlan,
  };
}
