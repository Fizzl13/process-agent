// Northwind Daily is a made-up news subscription, the same fictional company
// as in ReplyDesk. Every name, policy and action here is fictional: this is a
// public demo, and nothing is ever executed.

export const COMPANY = {
  name: "Northwind Daily",
  kind: "a daily news subscription (print and digital)",
};

export const POLICIES = [
  { id: "cancellation", text: "Cancellations take effect at the end of the current billing period; there is no cancellation fee." },
  { id: "delivery", text: "A missed or damaged print delivery is credited as one free day, at most 5 per month; a second miss in a week is escalated to the delivery partner." },
  { id: "refund", text: "Refunds for overpayment are made within 10 working days to the original payment method, after a person has checked the payment." },
  { id: "price_change", text: "Price changes are announced at least 30 days ahead; a customer may cancel before the new price applies." },
  { id: "address", text: "Address changes take 3 working days for print delivery; digital access is not affected." },
  { id: "login", text: "Login problems: a password reset link is sent to the email on file; never ask for a password." },
  { id: "human_control", text: "Refunds, cancellations and subscription changes are never executed without a person's approval." },
];

export const INTENTS = [
  { id: "cancellation", label: "Cancellation", labelNl: "Opzegging" },
  { id: "delivery", label: "Delivery complaint", labelNl: "Bezorgklacht" },
  { id: "billing", label: "Billing or refund", labelNl: "Factuur of terugbetaling" },
  { id: "price_change", label: "Price change", labelNl: "Prijswijziging" },
  { id: "address", label: "Address change", labelNl: "Adreswijziging" },
  { id: "login", label: "Login or digital access", labelNl: "Inloggen of digitale toegang" },
  { id: "subscription_change", label: "Subscription change", labelNl: "Abonnementswijziging" },
  { id: "other", label: "Other", labelNl: "Overig" },
];

// What the agent may propose. The risk of each action is fixed here, in code:
// the model proposes actions, it never decides how risky they are.
export const ACTIONS = {
  SEND_INFORMATION: { risk: "LOW", label: "Send information from the policies", labelNl: "Informatie uit het beleid sturen" },
  SEND_PASSWORD_RESET: { risk: "LOW", label: "Send a password reset link", labelNl: "Een link voor een nieuw wachtwoord sturen" },
  LOG_DELIVERY_COMPLAINT: { risk: "LOW", label: "Log the delivery complaint", labelNl: "De bezorgklacht registreren" },
  CREDIT_FREE_DAY: { risk: "MEDIUM", label: "Credit one free day", labelNl: "Eén gratis dag crediteren" },
  UPDATE_ADDRESS: { risk: "MEDIUM", label: "Change the delivery address", labelNl: "Het bezorgadres wijzigen" },
  ESCALATE_TO_DELIVERY_PARTNER: { risk: "MEDIUM", label: "Escalate to the delivery partner", labelNl: "Doorzetten naar de bezorgpartner" },
  OFFER_RETENTION_DISCOUNT: { risk: "MEDIUM", label: "Offer a retention discount", labelNl: "Een behoudkorting aanbieden" },
  ISSUE_REFUND: { risk: "HIGH", label: "Refund a payment", labelNl: "Een betaling terugstorten" },
  CANCEL_SUBSCRIPTION: { risk: "HIGH", label: "Cancel the subscription", labelNl: "Het abonnement opzeggen" },
  CHANGE_SUBSCRIPTION: { risk: "HIGH", label: "Change the subscription", labelNl: "Het abonnement wijzigen" },
};

export const SAMPLES = [
  { id: "late-paper", language: "en", label: "Late paper", text: "Hi, for the third time this week my paper didn't arrive. I pay for home delivery and I'm getting tired of this. Can you sort it out?" },
  { id: "dubbel-betaald", language: "nl", label: "Dubbel betaald", text: "Goedemiddag, volgens mijn bankafschrift is september twee keer afgeschreven. Kunt u de tweede betaling terugstorten?" },
  { id: "cancel", language: "en", label: "Cancel", text: "Please cancel my subscription. We mostly read the news online now. When does it stop, and do I still owe anything?" },
  { id: "inloggen", language: "nl", label: "Inloggen", text: "Ik kan niet meer inloggen in de app. Ik heb mijn wachtwoord al drie keer geprobeerd. Wat nu?" },
];
