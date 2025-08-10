export function slugCandidates(name: string, website?: string): string[] {
  const base = (name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const tokens = base.split(/\s+/).filter(Boolean);
  const combos = new Set<string>([
    tokens.join(''),
    tokens.join('-'),
    tokens.join('_'),
  ]);

  if (website) {
    const host = website.replace(/^https?:\/\//, '').split('/')[0];
    const left = host.split('.')[0]; // e.g. ororatech.com -> ororatech
    if (left) combos.add(left.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  }
  return Array.from(combos);
}

export async function fetchWithTimeout(url: string, ms = 6000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}
