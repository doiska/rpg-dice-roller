export default ExplodeModifier;
/**
 * An `ExplodeModifier` re-rolls dice that match a given test, and adds them to the results.
 *
 * @see {@link ReRollModifier} if you want to replace the old value with the new, rather than adding
 *
 * @extends ComparisonModifier
 */
declare class ExplodeModifier extends ComparisonModifier {
    /**
     * Create an `ExplodeModifier` instance
     *
     * @param {ComparePoint} [comparePoint=null] The comparison object
     * @param {boolean} [compound=false] Whether to compound or not
     * @param {boolean} [penetrate=false] Whether to penetrate or not
     *
     * @throws {TypeError} comparePoint must be a `ComparePoint` object
     */
    constructor(comparePoint?: any, compound?: boolean | undefined, penetrate?: boolean | undefined);
    /**
     * Whether the modifier should compound the results or not.
     *
     * @returns {boolean} `true` if it should compound, `false` otherwise
     */
    get compound(): boolean;
    /**
     * Whether the modifier should penetrate the results or not.
     *
     * @returns {boolean} `true` if it should penetrate, `false` otherwise
     */
    get penetrate(): boolean;
    /**
     * The default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {array}
     */
    defaultComparePoint(_context: StandardDice | RollGroup): array;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  notation: string,
     *  name: string,
     *  type: string,
     *  comparePoint: (ComparePoint|undefined),
     *  compound: boolean,
     *  penetrate: boolean
     * }}
     */
    toJSON(): {
        notation: string;
        name: string;
        type: string;
        comparePoint: (ComparePoint | undefined);
        compound: boolean;
        penetrate: boolean;
    };
    [compoundSymbol]: boolean;
    [penetrateSymbol]: boolean;
}
import ComparisonModifier from "./ComparisonModifier.js";
declare const compoundSymbol: unique symbol;
declare const penetrateSymbol: unique symbol;
