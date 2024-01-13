
/**
 * Encode text as ASCII. Note that JavaScript strings are arrays of
 * UTF-16 code points (2 bytes each). If any of the code points in the
 * string are greater than 255, behavior is undefined because ASCII
 * code points are single bytes and have a maximum value of 255.
 */
export function asciiEncode(text: string): Uint8Array {
    const ascii = new Uint8Array(text.length);

    for (let i = text.length - 1; i >= 0; i -= 1) {
        ascii[i] = text.charCodeAt(i);
    }

    return ascii;
}

/**
 * Decode a buffer as a string, treating each byte value as an ASCII
 * character code. Note that JavaScript strings are arrays of UTF-16
 * code points (2 bytes each).
 */
export function asciiDecode(data: Uint8Array): string {
    return String.fromCharCode(...data);
}
