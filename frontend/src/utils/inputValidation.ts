/** Shared input sanitizers and validators used across the UI. */

export const NAME_PATTERN = /^[A-Za-z][A-Za-z' -]*$/;
export const EMAIL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function sanitizeName(value: string): string {
  return value
    .replace(/[^A-Za-z' -]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/-{2,}/g, '-')
    .replace(/'{2,}/g, "'")
    .slice(0, 80);
}

export function sanitizeOrganization(value: string): string {
  return value
    .replace(/[^A-Za-z0-9&.'()\-/ ,]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/-{2,}/g, '-')
    .slice(0, 120);
}

export function sanitizeDepartment(value: string): string {
  return value
    .replace(/[^A-Za-z0-9&.'()\-/ ,]/g, '')
    .replace(/\s{2,}/g, ' ')
    .slice(0, 80);
}

export function sanitizeMrn(value: string): string {
  return value
    .replace(/[^A-Za-z0-9\-_/]/g, '')
    .slice(0, 40);
}

export function sanitizeNotes(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, 1000);
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function positiveNumberInput(value: string): string {
  // Keep an empty value while editing, but never allow a leading minus sign.
  return value.replace(/-/g, '');
}
