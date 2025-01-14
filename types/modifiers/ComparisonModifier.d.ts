export default ComparisonModifier;
/**
 * A `ComparisonModifier` is the base modifier class for comparing values.
 *
 * @abstract
 *
 * @extends Modifier
 *
 * @see {@link CriticalFailureModifier}
 * @see {@link CriticalSuccessModifier}
 * @see {@link ExplodeModifier}
 * @see {@link ReRollModifier}
 * @see {@link TargetModifier}
 */
declare class ComparisonModifier extends Modifier {
    /**
     * Create a `ComparisonModifier` instance.
     *
     * @param {ComparePoint} [comparePoint] The comparison object
     *
     * @throws {TypeError} `comparePoint` must be an instance of `ComparePoint` or `undefined`
     */
    constructor(comparePoint?: ComparePoint | undefined);
    /**
     * Set the compare point.
     *
     * @param {ComparePoint} comparePoint
     *
     * @throws {TypeError} value must be an instance of `ComparePoint`
     */
    set comparePoint(arg: ComparePoint | undefined);
    /**
     * The compare point.
     *
     * @returns {ComparePoint|undefined}
     */
    get comparePoint(): ComparePoint | undefined;
    /**
     * Empty default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {null}
     */
    defaultComparePoint(_context: StandardDice | RollGroup): null;
    /**
     * Check whether value matches the compare point or not.
     *
     * @param {number} value The value to compare with
     *
     * @returns {boolean} `true` if the value matches, `false` otherwise
     */
    isComparePoint(value: number): boolean;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  notation: string,
     *  name: string,
     *  type: string,
     *  comparePoint: (ComparePoint|undefined)
     * }}
     */
    toJSON(): {
        notation: string;
        name: string;
        type: string;
        comparePoint: (ComparePoint | undefined);
    };
    [comparePointSymbol]: ComparePoint | undefined;
}
import Modifier from "./Modifier.js";
import ComparePoint from "../ComparePoint.js";
declare const comparePointSymbol: unique symbol;
