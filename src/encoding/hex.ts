
/**
 * Table for mapping integer values in the range [0, 255] to their 2-character hex representation.
 */
const _BYTE_TO_HEX: readonly string[] = Array.from(
    { length: 0xff + 1 },
    (_, i) => i.toString(16).padStart(2, "0"),
);

/**
 * Encode binary data to hex. Does not trim leading zeros.
 */
export function hexEncode(data: Uint8Array, octetSeparator = ""): string {
    return Array.from(data, byteVal => _BYTE_TO_HEX[byteVal]!).join(octetSeparator);
}

/**
 * Decode a hex string into binary. This is case-insensitive, but an
 * invalid hex string will result in undefined behavior. A hex string
 * is invalid if it contains any non-hex characters.
 */
export function hexDecode(hex: string): Uint8Array {
    const binary = new Uint8Array(Math.ceil(hex.length / 2));
    const indexFrom = -(hex.length % 2); // shift all substrings left by one if hex length is odd

    for (let i = binary.length - 1; i >= 0; i -= 1) {
        const offset = indexFrom + i * 2;
        binary[i] = parseInt(hex.substring(offset, offset + 2), 16);
    }

    return binary;
}
