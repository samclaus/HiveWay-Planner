
/**
 * Returns an array of `n` random bytes, produced using a cryptographically
 * secure random number generator.
 */
export function randomBytes(n: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(n));
}

/**
 * Returns an integer in the range [0, max) which is not suitable for
 * seeding cryptographic algorithms.
 */
export function insecureRandomInt(max: number): number {
    return Math.floor(Math.random() * max);
}
