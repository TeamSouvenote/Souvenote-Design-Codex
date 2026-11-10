// Password strength meter shared by Sign Up, Reset Password and Account Settings.

/** 0 (too short) to 4 (solid). */
export function strength(p: string) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/\d/.test(p) && /[a-z]/i.test(p)) s++;
  if (/[^a-zA-Z0-9]/.test(p)) s++;
  return Math.min(s, 4);
}
export function strengthLabel(s: number) {
  return ['Too short', 'Weak', 'Okay', 'Strong', 'Solid'][s] || 'Strong';
}
