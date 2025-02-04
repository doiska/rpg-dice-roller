export default DiceRoll;
/**
 * A `DiceRoll` handles rolling of a single dice notation and storing the result.
 *
 * @see {@link DiceRoller} if you need to keep a history of rolls
 */
declare class DiceRoll {
    /**
     * Create a new `DiceRoll` instance with the given data.
     *
     * `data` can be an object of data, a JSON / base64 encoded string of such data.
     *
     * The object must contain a `notation` property that defines the notation and, optionally, an
     * array of RollResults, in the `rolls` property.
     *
     * @example <caption>Object</caption>
     * DiceRoll.import({
     *   notation: '4d6',
     *   rolls: ..., // ResultGroup object or array of roll results
     * });
     *
     * @example <caption>JSON</caption>
     * DiceRoll.import('{"notation":"4d6","rolls":[...]}');
     *
     * @example <caption>Base64</caption>
     * DiceRoll.import('eyJub3RhdGlvbiI6IjRkNiIsInJvbGxzIjpbXX0=');
     *
     * @param {{notation: string, rolls: RollResults[]}|string} data The data to import
     * @param {string} data.notation If `notation` is an object; the notation to import
     * @param {RollResults[]} [data.rolls] If `notation` is an object; the rolls to import
     *
     * @returns {DiceRoll} The new `DiceRoll` instance
     *
     * @throws {DataFormatError} data format is invalid
     */
    static import(data: {
        notation: string;
        rolls: RollResults[];
    } | string): DiceRoll;
    /**
     * Create a DiceRoll, parse the notation and roll the dice.
     *
     * If `notation` is an object, it must contain a `notation` property that defines the notation.
     * It can also have an optional array of `RollResults`, in the `rolls` property.
     *
     * @example <caption>String notation</caption>
     * const roll = new DiceRoll('4d6');
     *
     * @example <caption>Object</caption>
     * const roll = new DiceRoll({
     *   notation: '4d6',
     *   rolls: ..., // RollResults object or array of roll results
     * });
     *
     * @param {string|{notation: string, rolls: ResultGroup|Array.<ResultGroup|RollResults|string|number>}} notation The notation to roll
     * @param {string} notation.notation If `notation is an object; the notation to roll
     * @param {ResultGroup|Array.<ResultGroup|RollResults|string|number>} [notation.rolls] If
     * `notation` is an object; the rolls to import
     *
     * @throws {NotationError} notation is invalid
     * @throws {RequiredArgumentError} notation is required
     * @throws {TypeError} Rolls must be a valid result object, or an array
     */
    constructor(notation: string | {
        notation: string;
        rolls: ResultGroup | Array<ResultGroup | RollResults | string | number>;
    });
    /**
     * The average possible total for the notation.
     *
     * @since 4.3.0
     *
     * @returns {number}
     */
    get averageTotal(): number;
    /**
     * The maximum possible total for the notation.
     *
     * @since 4.3.0
     *
     * @returns {number}
     */
    get maxTotal(): number;
    /**
     * The minimum possible total for the notation.
     *
     * @since 4.3.0
     *
     * @returns {number}
     */
    get minTotal(): number;
    /**
     * The dice notation.
     *
     * @returns {string}
     */
    get notation(): string;
    /**
     * String representation of the rolls
     *
     * @example
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    get output(): string;
    /**
     * The dice rolled for the notation
     *
     * @returns {Array.<ResultGroup|RollResults|string|number>}
     */
    get rolls(): (string | number | RollResults | ResultGroup)[];
    /**
     * The roll total
     *
     * @returns {number}
     */
    get total(): number;
    /**
     * Export the object in the given format.
     * If no format is specified, JSON is returned.
     *
     * @see {@link DiceRoll#toJSON}
     *
     * @param {exportFormats} [format=exportFormats.JSON] The format to export the data as
     *
     * @returns {string|null} The exported data, in the specified format
     *
     * @throws {TypeError} Invalid export format
     */
    export(format?: Readonly<{
        BASE_64: number;
        JSON: number;
        OBJECT: number;
    }> | undefined): string | null;
    /**
     * Check whether the DiceRoll has expressions or not.
     *
     * @returns {boolean} `true` if the object has expressions, `false` otherwise
     */
    hasExpressions(): boolean;
    /**
     * Check whether the object has rolled dice or not
     *
     * @returns {boolean} `true` if the object has rolls, `false` otherwise
     */
    hasRolls(): boolean;
    /**
     * Roll the dice for the stored notation.
     *
     * This is called in the constructor, so you'll only need this if you want to re-roll the
     * notation. However, it's usually better to create a new `DiceRoll` instance instead.
     *
     * @returns {RollResults[]} The results of the rolls
     */
    roll(): RollResults[];
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  output: string,
     *  total: number,
     *  minTotal: number,
     *  maxTotal: number,
     *  notation: string,
     *  rolls: RollResults[],
     *  type: string
     * }}
     */
    toJSON(): {
        output: string;
        total: number;
        minTotal: number;
        maxTotal: number;
        notation: string;
        rolls: RollResults[];
        type: string;
    };
    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     *
     * @see {@link DiceRoll#output}
     */
    toString(): string;
}
import RollResults from "./results/RollResults.js";
import ResultGroup from "./results/ResultGroup.js";
