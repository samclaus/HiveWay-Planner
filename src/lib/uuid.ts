import { hexEncode } from "../encoding";

export function uuidv4(prefix = ""): string {
    const rnd = crypto.getRandomValues(new Uint8Array(16));

    // Change some bits to satisfy RFC 4122 (4.4)
    // Set version in bits 4-7 of time_hi_and_version
    rnd[6] = (rnd[6]! & 0x0f) | 0x40;
    // Set bits 6-7 of clk_seq_hi_res to 01
    rnd[8] = (rnd[8]! & 0x3f) | 0x80;

    return (
        prefix +
        hexEncode(rnd.subarray(0, 4)) + // 4 bytes
        "-" +
        hexEncode(rnd.subarray(4, 6)) + // 2 bytes
        "-" +
        hexEncode(rnd.subarray(6, 8)) + // 2 bytes
        "-" +
        hexEncode(rnd.subarray(8, 10)) + // 2 bytes
        "-" +
        hexEncode(rnd.subarray(10, 16)) // remaining 6 bytes
    );
}