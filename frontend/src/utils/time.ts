// SQLite CURRENT_TIMESTAMP is UTC but carries no zone marker ("YYYY-MM-DD HH:MM:SS"),
// so `new Date(str)` would read it as local time.
export const parseDbTimestamp = (ts: string): Date =>
  new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : `${ts.replace(' ', 'T')}Z`);
