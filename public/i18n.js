// NL | EN for the page text. English is the default; a visitor's choice is
// remembered in this browser. All strings here are ours and static, so the
// few with markup can be set as HTML.
const I18N = {
  en: {
    title: "Process Agent — AI with a human in control",
    demo: "DEMO", fictional: "(fictional) · NOTHING IS EXECUTED",
    h1: "AI reads the case.<br><em>Rules decide what runs.</em>",
    intro: "Paste a customer message. Claude works out what the customer wants and proposes actions. Then fixed rules, not the AI, set the risk: low-risk steps can be prepared automatically, account changes wait for approval, and money or cancellations are blocked until a person says yes.",
    incoming: "01 / INCOMING CASE",
    messageLabel: "Customer message",
    messagePlaceholder: "Paste the customer's message here…",
    run: "Run the agent →", running: "Running…",
    limit: "Demo limit: 10 cases per hour. Don't paste real customer data.",
    rulesTitle: "The fixed rules",
    ruleLow: "information, reset links, logging: prepared automatically",
    ruleMedium: "credits, address changes, discounts: a person approves",
    ruleHigh: "refunds, cancellations, plan changes: blocked until approved",
    ruleReview: (pct) => `AI confidence under ${pct}% or an upset customer: a person reviews`,
    decisionHead: "02 / DECISION", empty: "The analysis and the decision appear here.",
    intent: "INTENT", risk: "RISK", confidence: "CONFIDENCE", human: "HUMAN",
    required: "Required", notNeeded: "Not needed",
    why: "Why", checkFirst: "Check first", replyTitle: "Prepared reply",
    approve: "Approve as reviewer (simulated)", approved: "Approved in this demo. Nothing was executed.",
    footer: 'Built by <a href="https://fizzl.eu/">Frits · fizzl.eu</a> with Claude. Northwind Daily and its policies are made up for this demo.',
    source: "Source on GitHub ↗",
    unexpected: "Unexpected answer from the server.", failed: "Something went wrong.",
    offline: "Could not reach the agent. Check your connection.",
    ANALYZE_CASE: "Analyse the request", RETRIEVE_KNOWLEDGE: "Retrieve policies", POLICY_CHECK: "Check policies",
    PREPARE_RESPONSE: "Prepare the reply", HUMAN_REVIEW: "Human review", EXECUTE_ACTION: "Action",
    LOW: "LOW", MEDIUM: "MEDIUM", HIGH: "HIGH",
    COMPLETED: "Done", READY: "Ready", REQUIRED: "Needs a person", BLOCKED: "Blocked", APPROVED: "Approved",
  },
  nl: {
    title: "Process Agent — AI met een mens aan het roer",
    demo: "DEMO", fictional: "(verzonnen) · ER WORDT NIETS UITGEVOERD",
    h1: "AI leest de zaak.<br><em>Regels bepalen wat er gebeurt.</em>",
    intro: "Plak een klantbericht. Claude zoekt uit wat de klant wil en stelt acties voor. Daarna bepalen vaste regels, niet de AI, het risico: stappen met laag risico kunnen automatisch worden klaargezet, accountwijzigingen wachten op akkoord, en geld of opzeggingen zijn geblokkeerd tot een mens ja zegt.",
    incoming: "01 / BINNENGEKOMEN ZAAK",
    messageLabel: "Bericht van de klant",
    messagePlaceholder: "Plak hier het bericht van de klant…",
    run: "Start de agent →", running: "Bezig…",
    limit: "Demolimiet: 10 zaken per uur. Plak geen echte klantgegevens.",
    rulesTitle: "De vaste regels",
    ruleLow: "informatie, wachtwoordlinks, registreren: automatisch klaargezet",
    ruleMedium: "tegoed, adreswijziging, korting: een mens geeft akkoord",
    ruleHigh: "terugbetalen, opzeggen, abonnement wijzigen: geblokkeerd tot akkoord",
    ruleReview: (pct) => `AI minder dan ${pct}% zeker of een boze klant: een mens kijkt mee`,
    decisionHead: "02 / BESLISSING", empty: "De analyse en de beslissing verschijnen hier.",
    intent: "VRAAG", risk: "RISICO", confidence: "ZEKERHEID", human: "MENS",
    required: "Nodig", notNeeded: "Niet nodig",
    why: "Waarom", checkFirst: "Eerst controleren", replyTitle: "Klaargezet antwoord",
    approve: "Keur goed als beoordelaar (gesimuleerd)", approved: "Goedgekeurd in deze demo. Er is niets uitgevoerd.",
    footer: 'Gebouwd door <a href="https://fizzl.eu/">Frits · fizzl.eu</a> met Claude. Northwind Daily en het beleid zijn verzonnen voor deze demo.',
    source: "Broncode op GitHub ↗",
    unexpected: "Onverwacht antwoord van de server.", failed: "Er ging iets mis.",
    offline: "De agent is niet bereikbaar. Controleer je verbinding.",
    ANALYZE_CASE: "Vraag analyseren", RETRIEVE_KNOWLEDGE: "Beleid ophalen", POLICY_CHECK: "Beleid toetsen",
    PREPARE_RESPONSE: "Antwoord klaarzetten", HUMAN_REVIEW: "Menselijke controle", EXECUTE_ACTION: "Actie",
    LOW: "LAAG", MEDIUM: "GEMIDDELD", HIGH: "HOOG",
    COMPLETED: "Klaar", READY: "Klaar voor uitvoering", REQUIRED: "Mens nodig", BLOCKED: "Geblokkeerd", APPROVED: "Goedgekeurd",
  },
};

let lang = "en";
try { if (localStorage.getItem("lang") === "nl") lang = "nl"; } catch {}

function t(key) {
  return I18N[lang][key] ?? I18N.en[key] ?? key;
}

function applyLang() {
  document.documentElement.lang = lang;
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  document.dispatchEvent(new Event("langchange"));
}

document.querySelectorAll(".lang-switch button").forEach((b) => b.addEventListener("click", () => {
  lang = b.dataset.lang;
  try { localStorage.setItem("lang", lang); } catch {}
  applyLang();
}));
