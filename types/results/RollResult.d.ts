export default RollResult;
/**
 * A `RollResult` represents the value and applicable modifiers for a single die roll
 *
 * ::: tip
 * You will probably not need to create your own `RollResult` instances, unless you're importing
 * rolls, but `RollResult` objects will be returned when rolling dice.
 * :::
 */
declare class RollResult {
    /**
     * Create a `RollResult` instance.
     *
     * `value` can be a number, or an object containing a list of different values.
     * This allows you to specify the `initialValue`, `value` and `calculationValue` with different
     * values.
     *
     * @example <caption>Numerical value</caption>
     * const result = new RollResult(4);
     *
     * @example <caption>Object value</caption>
     * // must provide either `value` or `initialValue`
     * // `calculationValue` is optional.
     * const result = new RollResult({
     *   value: 6,
     *   initialValue: 4,
     *   calculationValue: 8,
     * });
     *
     * @example <caption>With modifiers</caption>
     * const result = new RollResult(4, ['explode', 'critical-success']);
     *
     * @param {number|{value: number, initialValue: number, calculationValue: number}} value The value
     * rolled
     * @param {number} [value.value] The value with modifiers applied
     * @param {number} [value.initialValue] The initial, unmodified value rolled
     * @param {number} [value.calculationValue] The value used in calculations
     * @param {string[]|Set<string>} [modifiers=[]] List of modifier names that affect this roll
     * @param {boolean} [useInTotal=true] Whether to include the roll value when calculating totals
     *
     * @throws {TypeError} Result value, calculation value, or modifiers are invalid
     */
    constructor(value: number | {
        value: number;
        initialValue: number;
        calculationValue: number;
    }, modifiers?: string[] | Set<string> | undefined, useInTotal?: boolean | undefined);
    /**
     * Set the modifier names that affect the roll.
     *
     * @example
     * rollResult.modifiers = ['explode', 're-roll'];
     *
     * @param {string[]|Set<string>} value
     *
     * @throws {TypeError} modifiers must be a Set or array of modifier names
     */
    set modifiers(arg: Set<string>);
    /**
     * The names of modifiers that affect the roll.
     *
     * @returns {Set<string>}
     */
    get modifiers(): Set<string>;
    /**
     * Set whether to use the value in total calculations or not.
     *
     * @param {boolean} value
     */
    set useInTotal(arg: boolean);
    /**
     * Whether to use the value in total calculations or not.
     *
     * @returns {boolean}
     */
    get useInTotal(): boolean;
    /**
     * Set the roll value.
     *
     * @param {number} value
     *
     * @throws {RangeError} value must be finite
     * @throws {TypeError} value is invalid
     */
    set value(arg: number);
    /**
     * Value of the roll after modifiers have been applied.
     *
     * @returns {number}
     */
    get value(): number;
    /**
     * Set the value to use in calculations.
     *
     * @param {number} value
     *
     * @throws {TypeError} value is invalid
     */
    set calculationValue(arg: number);
    /**
     * The value to use in calculations.
     * This may be changed by modifiers.
     *
     * @returns {number}
     */
    get calculationValue(): number;
    /**
     * The initial roll value before any modifiers.
     *
     * Not used for calculations and is just for reference.
     * You probably want `value` instead.
     *
     * @see {@link RollResult#value}
     *
     * @returns {number}
     */
    get initialValue(): number;
    /**
     * The visual flags for the modifiers that affect the roll.
     *
     * @see {@link RollResult#modifiers}
     *
     * @returns {string}
     */
    get modifierFlags(): string;
    set dice(arg: any);
    get dice(): any;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  calculationValue: number,
     *  modifierFlags: string,
     *  modifiers: string[],
     *  type: string,
     *  initialValue: number,
     *  useInTotal: boolean,
     *  value: number
     * }}
     */
    toJSON(): {
        calculationValue: number;
        modifierFlags: string;
        modifiers: string[];
        type: string;
        initialValue: number;
        useInTotal: boolean;
        value: number;
    };
    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     */
    toString(): string;
    [initialValueSymbol]: number;
    [calculationValueSymbol]: number | null | undefined;
    [modifiersSymbol]: Set<string> | undefined;
    [useInTotalSymbol]: boolean | undefined;
    [valueSymbol]: number | undefined;
    [diceSymbol]: any;
}
declare const initialValueSymbol: unique symbol;
declare const calculationValueSymbol: unique symbol;
declare const modifiersSymbol: unique symbol;
declare const useInTotalSymbol: unique symbol;
declare const valueSymbol: unique symbol;
declare const diceSymbol: unique symbol;
