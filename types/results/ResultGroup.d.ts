export default ResultGroup;
/**
 * A collection of results and expressions.
 * Usually used to represent the results of a `RollGroup` instance.
 *
 * This can contain `ResultGroup`, `RollResults`, operators, and plain numbers.
 *
 * ::: tip
 * You will probably not need to create your own `ResultGroup` instances, unless you're importing
 * rolls, but `ResultGroup` objects will be returned when rolling group rolls.
 * :::
 *
 * @since 4.5.0
 */
declare class ResultGroup {
    /**
     * Create a `ResultGroup` instance.
     *
     * @example <caption>Normal roll: `4d6+2d10`</caption>
     * const results = new ResultGroup([
     *  new RollResults([3, 5, 4, 2]),
     *  '+',
     *  new RollResults([4, 8]),
     * ]);
     *
     * @example <caption>Roll group: `{4d6+2d10/2, 5d6/2d%}`</caption>
     * const results = new ResultGroup([
     *  new ResultGroup([
     *    new RollResults([3, 5, 4, 2]),
     *    '+',
     *    new RollResults([4, 8]),
     *    '/',
     *    2,
     *  ]),
     *  new ResultGroup([
     *    new RollResults([3, 3, 5, 2, 4]),
     *    '/',
     *    new RollResults([87, 46]),
     *  ]),
     * ]);
     *
     * @param {Array.<ResultGroup|RollResults|number|string>} [results=[]] The results and expressions
     * @param {string[]|Set<string>} [modifiers=[]] List of modifier names that affect the group
     * @param {boolean} [isRollGroup=false] Whether the result group represents a roll group or not
     * @param {boolean} [useInTotal=true] Whether to include the group's value when calculating totals
     *
     * @throws {TypeError} Rolls must be an array
     */
    constructor(results?: (string | number | RollResults | ResultGroup)[] | undefined, modifiers?: string[] | Set<string> | undefined, isRollGroup?: boolean | undefined, useInTotal?: boolean | undefined);
    /**
     * Set whether the result group represents a roll group or not.
     *
     * @param {boolean} value
     */
    set isRollGroup(arg: boolean);
    /**
     * Whether the result group represents a roll group or not.
     *
     * @returns {boolean} `true` if it is a roll group, `false` otherwise
     */
    get isRollGroup(): boolean;
    /**
     * Set the modifier names that affect the group.
     *
     * @example
     * resultGroup.modifiers = ['drop', 'target-success'];
     *
     * @param {string[]|Set<string>} value
     *
     * @throws {TypeError} modifiers must be a Set or array of modifier names
     */
    set modifiers(arg: Set<string>);
    /**
     * The modifier names that affect the group.
     *
     * @returns {Set<string>}
     */
    get modifiers(): Set<string>;
    /**
     * Set the results.
     *
     * @param {Array.<ResultGroup|RollResults|number|string>} results
     *
     * @throws {TypeError} Results must be an array
     */
    set results(arg: (string | number | RollResults | ResultGroup)[]);
    /**
     * List of results.
     *
     * @returns {Array.<ResultGroup|RollResults|number|string>}
     */
    get results(): (string | number | RollResults | ResultGroup)[];
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
     * The number of results.
     *
     * @returns {number}
     */
    get length(): number;
    /**
     * The visual flags for the modifiers that affect the group.
     *
     * @see {@link ResultGroup#modifiers}
     *
     * @returns {string}
     */
    get modifierFlags(): string;
    /**
     * The total value of all the results after modifiers have been applied.
     *
     * @returns {number}
     */
    get value(): number;
    /**
     * Add a single result to the list.
     *
     * @param {ResultGroup|RollResults|number|string} value
     *
     * @throws {TypeError} Value type is invalid
     */
    addResult(value: ResultGroup | RollResults | number | string): void;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  modifierFlags: string,
     *  modifiers: string[],
     *  results: Array<ResultGroup|RollResults|number|string>,
     *  type: string,
     *  useInTotal: boolean,
     *  value: number
     * }}
     */
    toJSON(): {
        modifierFlags: string;
        modifiers: string[];
        results: Array<ResultGroup | RollResults | number | string>;
        type: string;
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
    [calculationValueSymbol]: number | null | undefined;
    [isRollGroupSymbol]: boolean | undefined;
    [modifiersSymbol]: Set<string> | undefined;
    [resultsSymbol]: any[] | undefined;
    [useInTotalSymbol]: boolean | undefined;
}
import RollResults from "./RollResults.js";
declare const calculationValueSymbol: unique symbol;
declare const isRollGroupSymbol: unique symbol;
declare const modifiersSymbol: unique symbol;
declare const resultsSymbol: unique symbol;
declare const useInTotalSymbol: unique symbol;
