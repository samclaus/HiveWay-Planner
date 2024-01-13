import type { HasName } from "./has-name";

export type Comparator<T> = (item1: T, item2: T) => number;

/**
 * Used for sorting strings alphabetically according to locale-specific (per-language/location) preferences.
 * 
 * Regarding case-sensitivity, this will provide a very nice sort that groups base letters (case-insensitive)
 * but sorts a particular case (upper/lower) first WITHIN each of those groups. This is deterministic, and NOT
 * the same as just coercing every string to lowercase before sorting, which would mean losing casing information
 * and making the sort semi-dependent on the order items come in from, say, the database.
 * 
 * For instance, in one test I did, group names came in this order:
 * 
 * 1. "a"
 * 2. "A"
 * 3. "aa"
 * 4. "aA"
 * 5. "Aa"
 * 6. "AA"
 * 7. "b"
 * 8. "B"
 * 9. "bb"
 * 10. and vice versa
 */
const collator = new Intl.Collator("en-US", { caseFirst: "false" });

export function sortStringAsc(l: string, r: string): number {
    return collator.compare(l, r);
}

export function sortByNameAsc(l: HasName, r: HasName): number {
    return collator.compare(l.name, r.name);
}

export function numericAsc(n1: number, n2: number): number {
    return n1 - n2;
}

export function dateAsc(l: Date | undefined, r: Date | undefined): number {
    return l > r ? 1 : -1;
}
