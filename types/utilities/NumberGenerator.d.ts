/**
 * List of built-in number generator engines.
 *
 * @since 4.2.0
 *
 * @see This uses [random-js](https://github.com/ckknight/random-js).
 * For details of the engines, check the [documentation](https://github.com/ckknight/random-js#engines).
 *
 * @type {{
 *  min: {next(): number},
 *  max: {next(): number, range: number[]},
 *  browserCrypto: Engine,
 *  nodeCrypto: Engine,
 *  MersenneTwister19937: MersenneTwister19937,
 *  nativeMath: Engine
 * }}
 */
export const engines: {
    min: {
        next(): number;
    };
    max: {
        next(): number;
        range: number[];
    };
    browserCrypto: Engine;
    nodeCrypto: Engine;
    MersenneTwister19937: MersenneTwister19937;
    nativeMath: Engine;
};
export const generator: NumberGenerator;
import { browserCrypto } from "random-js/dist/engine/browserCrypto";
import { nodeCrypto } from "random-js/dist/engine/nodeCrypto";
import { MersenneTwister19937 } from "random-js/dist/engine/MersenneTwister19937";
import { nativeMath } from "random-js/dist/engine/nativeMath";
/**
 * The `NumberGenerator` is capable of generating random numbers.
 *
 * @since 4.2.0
 *
 * @see This uses [random-js](https://github.com/ckknight/random-js).
 * For details of the engines, check the [documentation](https://github.com/ckknight/random-js#engines).
 */
declare class NumberGenerator {
    /**
     * Create a `NumberGenerator` instance.
     *
     * The `engine` can be any object that has a `next()` method, which returns a number.
     *
     * @example <caption>Built-in engine</caption>
     * new NumberGenerator(engines.nodeCrypto);
     *
     * @example <caption>Custom engine</caption>
     * new NumberGenerator({
     *   next() {
     *     // return a random number
     *   },
     * });
     *
     * @param {Engine|{next(): number}} [engine=nativeMath] The RNG engine to use
     *
     * @throws {TypeError} engine must have function `next()`
     */
    constructor(engine?: Engine | {
        next(): number;
    });
    /**
     * Set the engine.
     *
     * The `engine` can be any object that has a `next()` method, which returns a number.
     *
     * @example <caption>Built-in engine</caption>
     * numberGenerator.engine = engines.nodeCrypto;
     *
     * @example <caption>Custom engine</caption>
     * numberGenerator.engine = {
     *   next() {
     *     // return a random number
     *   },
     * });
     *
     * @see {@link engines}
     *
     * @param {Engine|{next(): number}} engine
     *
     * @throws {TypeError} engine must have function `next()`
     */
    set engine(arg: any);
    /**
     * The current engine.
     *
     * @returns {Engine|{next(): number}}
     */
    get engine(): any;
    /**
     * Generate a random integer within the inclusive range `[min, max]`.
     *
     * @param {number} min The minimum integer value, inclusive.
     * @param {number} max The maximum integer value, inclusive.
     *
     * @returns {number} The random integer
     */
    integer(min: number, max: number): number;
    /**
     * Returns a floating-point value within `[min, max)` or `[min, max]`.
     *
     * @param {number} min The minimum floating-point value, inclusive.
     * @param {number} max The maximum floating-point value.
     * @param {boolean} [inclusive=false] If `true`, `max` will be inclusive.
     *
     * @returns {number} The random floating-point value
     */
    real(min: number, max: number, inclusive?: boolean | undefined): number;
}
export {};
