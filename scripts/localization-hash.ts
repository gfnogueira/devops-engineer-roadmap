import { createHash } from 'node:crypto';

/**
 * Deterministic source hashes for localization overlays (localization contract version 1).
 *
 * A hash identifies the exact English metadata a translation was made from. It is computed
 * over metadata fields only, never over source-file bytes, so reformatting a JSON record does
 * not make a translation stale but any wording change does.
 *
 *   competency: sha256( UTF-8( JSON.stringify({ title: NFC(title), summary: NFC(summary) }) ) )
 *   track:      sha256( UTF-8( JSON.stringify({ title: NFC(title) }) ) )
 *
 * The property order is fixed as written. The value is rendered as `sha256:` followed by 64
 * lowercase hexadecimal digits. No trimming, case folding or whitespace collapsing is applied.
 * Changing this algorithm is a localization contract change.
 */
export const HASH_PREFIX = 'sha256:';

function digest(canonical: string): string {
  return `${HASH_PREFIX}${createHash('sha256').update(canonical, 'utf8').digest('hex')}`;
}

/** The exact string hashed for a competency. */
export function competencyCanonicalSource(title: string, summary: string): string {
  return JSON.stringify({ title: title.normalize('NFC'), summary: summary.normalize('NFC') });
}

/** The exact string hashed for a track. A track has only one translatable field, `title`. */
export function trackCanonicalSource(title: string): string {
  return JSON.stringify({ title: title.normalize('NFC') });
}

export function competencySourceHash(title: string, summary: string): string {
  return digest(competencyCanonicalSource(title, summary));
}

export function trackSourceHash(title: string): string {
  return digest(trackCanonicalSource(title));
}
