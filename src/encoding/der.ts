
export const enum DERType {
    EOC = 0x00, // ASN.1 (DER) EOC identifier
    Integer = 0x02, // ASN.1 (DER) integer identifier
    BitString = 0x03, // ASN.1 (DER) bit string identifier
    OctetString = 0x04, // ASN.1 (DER) octet string identifier
    Sequence = 0x30, // ASN.1 (DER) sequence identifier
}

/**
 * Calculates the minimum number of bytes needed to represent
 * val in Base256 (each byte is 256 times as significant as
 * the one immediately to the right of it).
 * @param   val The value to be represented.
 * @returns     The number of bytes necessary to store val.
 */
function base256Len(val: number): number {
    return Math.ceil(Math.log2(val + 1) / 8);
}

/**
 * Strips away any extra zeroes at the beginning of a big
 * integer, leaving one or prepending one at the beginning
 * if necessary in the case where the leftmost bit of the
 * first nonzero element is set, to make the big integer
 * unsigned for the purpose of DER encoding.
 * @param   int A base-256 big integer binary buffer.
 * @returns     The integer, unsigned and without padding.
 */
export function derEnsureUnsigned(int: Uint8Array): Uint8Array {
    if (int.length === 0)
        throw new Error(
            "Attempted to convert an empty Uint8Array to an unsigned buffer."
        );

    let firstNonzero = 0;
    while (int[firstNonzero] === 0) firstNonzero++;

    // TODO: I added this here when turning on strict null checks (6/21/2022);
    // it seems like this function has bugs and we should probably re-evaluate
    // it at some point but I don't remember how it works right now so I am just
    // going to at least let it crash with a more sensible, easy-to-find error
    // --Sam
    const firstNonzeroValue = int[firstNonzero];
    if (typeof firstNonzeroValue !== "number") {
        throw new Error("buffer did not contain a nonzero value");
    }

    if (firstNonzero !== 0) {
        return firstNonzeroValue >= 0x80
            ? int.slice(firstNonzero - 1)
            : int.slice(firstNonzero);
    }

    return firstNonzeroValue >= 0x80
        ? new Uint8Array([0, ...int])
        : int;
}

/**
 * Encodes a buffer as the specified ASN.1 (DER) primitive.
 * @param   type  The ASN.1 (DER) primitive type identifier.
 * @param   buf   The data to encode.
 * @returns       An ASN.1 DER primitive sequence.
 */
export function derEncode(type: DERType, buf: Uint8Array): Uint8Array {
    let primitive: Uint8Array;
    let lenOctets = 1;

    // Figure out if we can encode content length in short form or
    // if long form is necessary, size DER buffer accordingly.
    if (buf.length >= 0x80) {
        let nLenBytes = base256Len(buf.length);
        lenOctets += nLenBytes;

        // type + LF length byte + length bytes + content
        primitive = new Uint8Array(1 + 1 + nLenBytes + buf.length);

        // long form length byte says how many following content length bytes
        primitive[1] = 0x80 + nLenBytes;

        // Base256 representation of content length
        for (
            let n = buf.length, i = 1 + nLenBytes;
            n > 0;
            n = Math.floor(n / 256), i--
        )
            primitive[i] = n % 256;
    } else {
        // type + SF length byte + content
        primitive = new Uint8Array(1 + 1 + buf.length);

        // short form length byte is the content length
        primitive[1] = buf.length;
    }

    // Content type.
    primitive[0] = type;

    // Content at the end (following type and length octets).
    primitive.set(buf, 1 + lenOctets);

    return primitive;
}

/**
 * Converts a binary Uint8Array to an integer, with each byte--moving
 * from right to left--being 256 times more significant than the last.
 * @param   buf    The Uint8Array to be interpreted as a base256 integer.
 * @param   signed Indicates whether the buffer should be interpreted as a
 *                 signed integer (if the leftmost bit is 1); default is false;
 * @returns        The interpreted integer. Please note that if the value
 *                 represented by buf is greated than Number.MAX_SAFE_INTEGER,
 *                 the value returned will be unreliable.
 */
function decodeBase256Integer(buf: Uint8Array, signed?: boolean): number {
    // IMPORTANT: asset that the buffer has at least one element, otherwise return 0
    if (buf.length === 0) {
        return 0;
    }

    const firstElem = buf[0]!; // guaranteed by length check above

    let value = (firstElem >= 0x80 && signed) ? -Math.pow(256, buf.length) : 0;

    for (
        let i = buf.length - 1, sig = 1;
        i >= 0;
        i--, sig *= 256
    ) {
        // buf[i] is guaranteed by the i >= 0 check above (reverse for-loop)
        value += buf[i]! * sig;
    }

    return value;
}

/**
 * Simple DER decoder which is constructed with a buffer. `take()` must be called repeatedly
 * to iterate through DER objects encoded in the buffer.
 */
export class DERDecoder {

    private remaining: Uint8Array;

    constructor(data: ArrayBuffer | ArrayBufferView) {
        if (data instanceof ArrayBuffer) {
            // Create a view of the entire buffer
            this.remaining = new Uint8Array(data);
        } else {
            // Create a Uint8Array view of the existing view's underlying buffer, taking into
            // account that the existing view could have an element size larger than a byte
            // and that it could reference only a slice of a larger ArrayBuffer
            this.remaining = new Uint8Array(
                data.buffer,
                data.byteOffset,
                data.byteLength
            );
        }
    }

    /**
     * Extract the next DER element's data (as a slice, not a copy) and advance the cursor. Does
     * not return the type of the element.
     */
    take(): Uint8Array {
        const buff = this.remaining;

        if (buff[0] === DERType.EOC) {
            this.remaining = buff.subarray(1);
            return buff.subarray(1, 1); // EOC element has no content
        }

        let off = 0;
        let len = 0;

        const lenIdentifier = buff[1];

        if (typeof lenIdentifier !== "number") {
            throw new Error(`bad ASN length identifier (${lenIdentifier})`);
        }

        if (lenIdentifier > 0x80) {
            off = 2 + (lenIdentifier - 0x80);
            len = decodeBase256Integer(buff.slice(2, off));
        } else if (lenIdentifier > 0 && lenIdentifier < 0x80) {
            off = 2;
            len = lenIdentifier;
        } else {
            throw new Error(`bad ASN length identifier (${lenIdentifier})`);
        }

        this.remaining = buff.subarray(off + len);
        return buff.subarray(off, off + len);
    }

    /**
     * Navigate into the next DER element by reading it and setting the data source to its data
     * so that future calls to `take()` will read sub-elements. This can result in undefined
     * behavior if the next element does not contain a sequence of DER elements.
     */
    into(): void {
        this.remaining = this.take();
    }

}
