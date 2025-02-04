export default TargetModifier;
/**
 * A `TargetModifier` determines whether rolls are classed as a success, failure, or neutral.
 *
 * This modifies the roll values, depending on the state;
 *
 * success = `1`, failure = `-1`, neutral = `0`.
 *
 * @extends ComparisonModifier
 */
declare class TargetModifier extends ComparisonModifier {
    /**
     * Create a `TargetModifier` instance.
     *
     * @param {ComparePoint} successCP The success comparison object
     * @param {ComparePoint} [failureCP=null] The failure comparison object
     *
     * @throws {TypeError} failure comparePoint must be instance of ComparePoint or null
     */
    constructor(successCP: ComparePoint, failureCP?: ComparePoint | undefined);
    /**
     * Set the failure compare point
     *
     * @param {ComparePoint|null} comparePoint
     *
     * @throws {TypeError} failure comparePoint must be instance of ComparePoint or null
     */
    set failureComparePoint(arg: ComparePoint | null);
    /**
     * The failure compare point for the modifier
     *
     * @returns {ComparePoint|null}
     */
    get failureComparePoint(): ComparePoint | null;
    /**
     * Set the success compare point for the modifier
     *
     * @param {ComparePoint} value
     */
    set successComparePoint(arg: ComparePoint);
    /**
     * The success compare point for the modifier
     *
     * @returns {ComparePoint}
     */
    get successComparePoint(): ComparePoint;
    /**
     * Check if the value is a success/failure/neither and return the corresponding state value.
     *
     * @param {number} value The number to compare against
     *
     * @returns {number} success = `1`, failure = `-1`, neutral = `0`
     */
    getStateValue(value: number): number;
    /**
     * Check if the `value` matches the failure compare point.
     *
     * A response of `false` does _NOT_ indicate a success.
     * A value is a success _ONLY_ if it passes the success compare point.
     * A value could be neither a failure nor a success.
     *
     * @param {number} value The number to compare against
     *
     * @returns {boolean}
     */
    isFailure(value: number): boolean;
    /**
     * Check if the `value` is neither a success nor a failure.
     *
     * @param {number} value The number to compare against
     *
     * @returns {boolean} `true` if the value doesn't match the success and failure compare points
     */
    isNeutral(value: number): boolean;
    /**
     * Check if the `value` matches the success compare point.
     *
     * A response of `false` does _NOT_ indicate a failure.
     * A value is a failure _ONLY_ if it passes the failure compare point.
     * A value could be neither a failure nor a success.
     *
     * @param {number} value The number to compare against
     *
     * @returns {boolean}
     */
    isSuccess(value: number): boolean;
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
     *  failureComparePoint: (ComparePoint|null),
     *  successComparePoint: ComparePoint
     * }}
     */
    toJSON(): {
        notation: string;
        name: string;
        type: string;
        comparePoint: (ComparePoint | undefined);
        failureComparePoint: (ComparePoint | null);
        successComparePoint: ComparePoint;
    };
    [failureCPSymbol]: ComparePoint | null | undefined;
}
import ComparisonModifier from "./ComparisonModifier.js";
import ComparePoint from "../ComparePoint.js";
declare const failureCPSymbol: unique symbol;
