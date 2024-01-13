import { asciiDecode, asciiEncode } from "./ascii";

/**
 * Encode data to Base64, per the MIME specification, which uses the
 * characters a-z, A-Z, 0-9, '+', and '/' for the 64 possible values
 * of each character. The output will be padded and may optionally
 * be made URL-safe, in which case '+' characters will be replaced
 * with '-' and '/' will be replaced with '_', and the padding will
 * be omitted (0-2 '=' characters at the end).
 */
export function base64Encode(data: Uint8Array, urlSafe = false, preservePadding = false): string {
    let base64 = btoa(asciiDecode(data));

    if (urlSafe) {
        base64 = base64.replace(/\+/g, "-").replace(/\//g, "_");

        if (!preservePadding) {
            base64 = base64.replace(/=+$/, "");
        }
    }

    return base64;
}

/**
 * Decode Base64 data. The input must use the MIME-specified character set,
 * as described in `base64Encode()`, but padding may be omitted and '+'
 * and '/' characters may be replaced with '-' and '_', respectively.
 * Invalid input will cause undefined behavior.
 */
export function base64Decode(base64: string): Uint8Array {
    return asciiEncode(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
}