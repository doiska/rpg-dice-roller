export default ComparePoint;
/**
 * A `ComparePoint` object compares numbers against each other.
 * For example, _is 6 greater than 3_, or _is 8 equal to 10_.
 */
declare class ComparePoint {
    /**
     * Check if the operator is valid.
     *
     * @param {string} operator
     *
     * @returns {boolean} `true` if the operator is valid, `false` otherwise
     */
    static isValidOperator(operator: string): boolean;
    /**
     * Create a `ComparePoint` instance.
     *
     * @param {string} operator The comparison operator (One of `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`)
     * @param {number} value The value to compare to
     *
     * @throws {CompareOperatorError} operator is invalid
     * @throws {RequiredArgumentError} operator and value are required
     * @throws {TypeError} value must be numeric
     */
    constructor(operator: string, value: number);
    /**
     * Set the comparison operator.
     *
     * @param {string} operator One of `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`
     *
     * @throws CompareOperatorError operator is invalid
     */
    set operator(arg: string);
    /**
     * The comparison operator.
     *
     * @returns {string}
     */
    get operator(): string;
    /**
     * Set the value.
     *
     * @param {number} value
     *
     * @throws {TypeError} value must be numeric
     */
    set value(arg: number);
    /**
     * The comparison value
     *
     * @returns {number}
     */
    get value(): number;
    /**
     * Check whether value matches the compare point
     *
     * @param {number} value The number to compare
     *
     * @returns {boolean} `true` if it is a match, `false` otherwise
     */
    isMatch(value: number): boolean;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{type: string, value: number, operator: string}}
     */
    toJSON(): {
        type: string;
        value: number;
        operator: string;
    };
    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     */
    toString(): string;
}
