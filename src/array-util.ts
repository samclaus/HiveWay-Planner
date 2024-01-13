
/**
 * Searches through the given array (starting from the beginning) until an item is found which is _equal_
 * (using JavaScript '===' semantics) to the given item. If such an item is found, it is removed from the
 * array (mutating the array itself). Otherwise, the array is not affected. Returns the array itself
 * either way.
 */
export function removeFirstOccurrence<T>(arr: T[], toRemove: T): T[] {
    const index = arr.indexOf(toRemove);

    if (index >= 0) {
        arr.splice(index, 1);
    }

    return arr;
}

/**
 * Searches through the given array (starting from the beginning) until an item is found for which
 * the given callback returns true. If such an item is found, it is removed from the array (mutating
 * the array itself) and returned. Otherwise, the array is not affected.
 */
export function removeFirstMatching<T>(arr: T[], predicate: (item: T) => boolean): T | undefined {
    const index = arr.findIndex(predicate);

    return index >= 0 ? arr.splice(index, 1)[0] : undefined;
}

/**
 * Clear all of the elements out of an array, mutating it (does NOT create a new array).
 */
export function clearArray(arr: any[]): void {
    // Thank you, JavaScript, for being the jankiest language out there
    arr.length = 0;
}
