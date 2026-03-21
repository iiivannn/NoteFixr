export const REFUSAL_PATTERNS = [
  "does not contain relevant",
  "cannot create",
  "not supported",
  "i would be happy to help",
  "could you provide more",
  "i can't",
  "i cannot",
  "unfortunately",
  "unable to",
  "image creation is not supported",
  "i don't have the ability",
  "as an ai",
];

export function isRefusal(text: string): boolean {
  const lower = text.toLowerCase();
  return REFUSAL_PATTERNS.some((pattern) => lower.includes(pattern));
}
