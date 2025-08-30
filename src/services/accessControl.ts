// Access control configuration
const ALLOWED_EMAILS = [
  'isumenuka@gmail.com' // Owner email - free access
];

const OWNER_CONTACT = {
  github: 'https://github.com/isumenuka',
  email: 'isumenuka@gmail.com'
};

/**
 * Check if an email is allowed to access the application
 */
export function isEmailAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

/**
 * Get owner contact information
 */
export function getOwnerContact() {
  return OWNER_CONTACT;
}

/**
 * Add email to allowed list (for owner use)
 */
export function addAllowedEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  if (!ALLOWED_EMAILS.includes(normalizedEmail)) {
    ALLOWED_EMAILS.push(normalizedEmail);
    return true;
  }
  return false;
}

/**
 * Remove email from allowed list (for owner use)
 */
export function removeAllowedEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  const index = ALLOWED_EMAILS.indexOf(normalizedEmail);
  if (index > -1) {
    ALLOWED_EMAILS.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Get all allowed emails (for owner use)
 */
export function getAllowedEmails(): string[] {
  return [...ALLOWED_EMAILS];
}