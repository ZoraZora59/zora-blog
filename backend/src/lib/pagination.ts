export function parseNumberParam(value: string | undefined, fallback: number, minimum = 0) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(Math.floor(parsed), minimum);
}

export function parseIdParam(value: string | undefined) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 0;
  }

  return parsed;
}

export function parseOrder(value: string | undefined) {
  return value === 'asc' ? 'asc' : 'desc';
}
