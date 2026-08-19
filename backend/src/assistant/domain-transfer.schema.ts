import type { DomainTransferData } from './chat.types.js';

export interface RequirementField<K extends keyof DomainTransferData = keyof DomainTransferData> {
  name: K;
  description: string;
  why: string;
  whereToFind: string;
  question: string;
  validate: (input: string) => { ok: true; value: DomainTransferData[K] } | { ok: false; error: string };
}

const yesNo = (input: string): boolean | undefined => {
  const value = input.trim().toLowerCase();
  if (/^(yes|y|confirmed|done|i do|i can|it is|unlocked|true)\b/.test(value)) return true;
  if (/^(no|n|not yet|locked|i don't|i do not|false)\b/.test(value)) return false;
  return undefined;
};

export const DOMAIN_TRANSFER_REQUIREMENTS: RequirementField[] = [
  {
    name: 'domainName',
    description: 'The website address you want to transfer, such as example.com.',
    why: 'The provisioning team uses it to identify the registration to move.',
    whereToFind: 'It appears in your current registrar dashboard and on renewal receipts.',
    question: 'What domain name would you like to transfer? (For example, example.com.)',
    validate: (input) => {
      const value = input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\.$/, '');
      return /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)
        ? { ok: true, value }
        : { ok: false, error: 'That does not look like a domain name. Please enter something like example.com (without a page path).' };
    },
  },
  {
    name: 'currentProvider',
    description: 'The registrar currently managing the domain registration.',
    why: 'Transfer steps and labels vary slightly by registrar.',
    whereToFind: 'Check the company where you renew the domain, or search your email for a domain-renewal receipt.',
    question: 'Who is the domain currently registered with? For example, Namecheap, GoDaddy, or Squarespace.',
    validate: (input) => input.trim().length >= 2 ? { ok: true, value: input.trim() } : { ok: false, error: 'Please enter the current registrar or say “I’m not sure”.' },
  },
  {
    name: 'eppCode',
    description: 'The authorization code (also called an EPP or transfer code) that approves the move.',
    why: 'It proves that the domain owner authorized this transfer.',
    whereToFind: 'In the current registrar’s domain settings, look for “Transfer out”, “Authorization code”, or “EPP code”. Some registrars email it to the admin contact.',
    question: 'Please paste the authorization/EPP code from your current registrar. Treat it like a temporary password.',
    validate: (input) => input.trim().length >= 4 ? { ok: true, value: input.trim() } : { ok: false, error: 'That code looks too short. Please paste the full authorization/EPP code.' },
  },
  {
    name: 'domainUnlocked',
    description: 'A registrar lock prevents unauthorized transfers.',
    why: 'The registry rejects a transfer while the domain is locked.',
    whereToFind: 'Open the domain settings at your current registrar and look for “Domain lock” or “Transfer lock”.',
    question: 'Is the domain unlocked for transfer? Please answer yes or no.',
    validate: (input) => { const value = yesNo(input); return value === undefined ? { ok: false, error: 'Please answer yes or no. If it is still locked, you can unlock it in the current registrar’s domain settings.' } : { ok: true, value }; },
  },
  {
    name: 'adminEmailAccess',
    description: 'Access to the domain’s administrative contact email.',
    why: 'Transfer approval or verification messages may be sent there.',
    whereToFind: 'Check the domain contact details in your registrar account. Privacy may hide the public address, but the registrar will show the underlying contact.',
    question: 'Can you currently receive messages at the domain’s admin contact email? Please answer yes or no.',
    validate: (input) => { const value = yesNo(input); return value === undefined ? { ok: false, error: 'Please answer yes or no. You may need to update the admin contact before starting the transfer.' } : { ok: true, value }; },
  },
  {
    name: 'domainAgeEligible',
    description: 'A domain generally must be more than 60 days old and not transferred within the last 60 days.',
    why: 'Registry and ICANN transfer restrictions can block recently created or transferred domains.',
    whereToFind: 'Check the registration and transfer dates in your registrar dashboard or registration confirmation emails.',
    question: 'Was the domain registered or last transferred more than 60 days ago? Please answer yes or no.',
    validate: (input) => { const value = yesNo(input); return value === undefined ? { ok: false, error: 'Please answer yes or no based on the most recent registration or transfer date.' } : { ok: true, value }; },
  },
  {
    name: 'whoisPrivacyStatus',
    description: 'WHOIS privacy masks personal contact details in public registration records.',
    why: 'Some registrars require a quick privacy or contact check so approval messages reach the owner.',
    whereToFind: 'Look for “Domain privacy”, “WHOIS privacy”, or “Contact privacy” in the current registrar’s domain settings.',
    question: 'What is the WHOIS privacy status: enabled, disabled, or unsure?',
    validate: (input) => {
      const value = input.trim().toLowerCase();
      if (/enabled|on|active|yes/.test(value)) return { ok: true, value: 'enabled' };
      if (/disabled|off|inactive|no/.test(value)) return { ok: true, value: 'disabled' };
      if (/unsure|not sure|unknown|don.t know/.test(value)) return { ok: true, value: 'unsure' };
      return { ok: false, error: 'Please answer enabled, disabled, or unsure.' };
    },
  },
];

export const requirementFor = (name: keyof DomainTransferData) => DOMAIN_TRANSFER_REQUIREMENTS.find((field) => field.name === name)!;
