export default MaxModifier;
/**
 * A `MaxModifier` causes die rolls over a maximum value to be treated as the maximum value.
 *
 * @since 4.3.0
 *
 * @see {@link MinModifier} for the opposite of this modifier
 *
 * @extends {Modifier}
 */
declare class MaxModifier extends Modifier {
    /**
     * Create a `MaxModifier` instance.
     *
     * @param {number} max The maximum value
     *
     * @throws {TypeError} max must be a number
     */
    constructor(max: number);
    /**
     * Set the maximum value.
     *
     * @param {number} value
     *
     * @throws {TypeError} max must be a number
     */
    set max(arg: number);
    /**
     * The maximum value.
     *
     * @returns {Number}
     */
    get max(): number;
    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string, max: Number}}
     */
    toJSON(): {
        notation: string;
        name: string;
        type: string;
        max: number;
    };
    [maxSymbol]: number | undefined;
}
import Modifier from "./Modifier.js";
declare const maxSymbol: unique symbol;
