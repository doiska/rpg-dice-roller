export default SortingModifier;
/**
 * A `SortingModifier` sorts roll results by their value, either ascending or descending.
 *
 * @extends ComparisonModifier
 */
declare class SortingModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order: number;
    /**
     * Create a `SortingModifier` instance.
     *
     * @param {string} [direction=a] The direction to sort in; 'a' (Ascending) or 'd' (Descending)
     *
     * @throws {RangeError} Direction must be 'a' or 'd'
     */
    constructor(direction?: string | undefined);
    /**
     * Set the sort direction.
     *
     * @param {string} value Either 'a' (Ascending) or 'd' (Descending)
     *
     * @throws {RangeError} Direction must be 'a' or 'd'
     */
    set direction(arg: string);
    /**
     * The sort direction.
     *
     * @returns {string} Either 'a' or 'd'
     */
    get direction(): string;
    /**
     * The name of the modifier.
     *
     * @returns {string} 'sorting'
     */
    get name(): string;
    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation(): string;
    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results: RollResults, _context: StandardDice | RollGroup): RollResults;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string, direction: string}}
     */
    toJSON(): {
        notation: string;
        name: string;
        type: string;
        direction: string;
    };
    [directionSymbol]: string | undefined;
}
import RollResults from "../results/RollResults.js";
declare const directionSymbol: unique symbol;
