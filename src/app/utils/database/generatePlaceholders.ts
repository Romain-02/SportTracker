export function generatePlaceholders(nb: number): string {
  return Array(nb).fill('?').join(', ');
}
