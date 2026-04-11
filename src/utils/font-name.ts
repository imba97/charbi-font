export function normalizeFamilyForFileName(family: string): string {
  return family.replace(/\s+/g, "");
}
