// Simple allowlist (placeholder)
export const ALLOWLIST = ["C:\\Users\\"];

export function isAllowed(path: string) {
  return ALLOWLIST.some(p => path.startsWith(p));
}
