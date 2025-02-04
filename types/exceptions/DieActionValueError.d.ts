export default DieActionValueError;
/**
 * An error thrown when an invalid die action (e.g. Exploding on a d1) occurs
 */
declare class DieActionValueError extends Error {
    /**
     * Create a `DieActionValueError`
     *
     * @param {StandardDice} die The die the action was on
     * @param {string|null} [action=null] The invalid action
     */
    constructor(die: StandardDice, action?: string | null | undefined);
    action: string | null;
    die: StandardDice;
}
