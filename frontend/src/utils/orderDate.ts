export function parseApprovalDate(value: string, issueDate: string): string | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(value.trim());
  if (!match || !/^\d{4}-\d{2}-\d{2}$/.test(issueDate)) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(issueDate.slice(0, 4));
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
