
/**
 * Low-level, generic timeout error. It is critical to have the entire codebase (including
 * library-ish helper code) use the same underlying type for various timeout errors so that
 * error handling/feedback code can identify the category of error and provide nice
 * internationalization of messages, etc.
 */
export class TimeoutError extends Error {

    constructor(
        /**
         * The millisecond duration that was allotted for the operation
         * (which was surpassed, causing the error to be thrown).
         */
        readonly allowedDurationMS: number,
        /**
         * TODO: need to think about how to handle internationalization and think about code
         * layers/dependencies/decoupling.
         */
        message = `the operation took longer than ${Math.floor(allowedDurationMS / 1000)}s to complete`,
    ) {
        super(message);
    }

}
