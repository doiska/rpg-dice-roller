/**
 * Check if `a` is comparative to `b` with the given operator.
 *
 * @example <caption>Is `a` greater than `b`?</caption>
 * const a = 4;
 * const b = 2;
 *
 * compareNumber(a, b, '>'); // true
 *
 * @example <caption>Is `a` equal to `b`?</caption>
 * const a = 4;
 * const b = 2;
 *
 * compareNumber(a, b, '='); // false
 *
 * @param {number} a The number to compare with `b`
 * @param {number} b The number to compare with `a`
 * @param {string} operator A valid comparative operator: `=, <, >, <=, >=, !=, <>`
 *
 * @returns {boolean} `true` if the comparison matches, `false` otherwise
 */
export function compareNumbers(a: number, b: number, operator: string): boolean;
/**
 * Evaluate mathematical strings.
 *
 * @example
 * evaluate('5+6'); // 11
 *
 * @param {string} equation The mathematical equation to compute.
 *
 * @returns {number} The result of the equation
 */
export function evaluate(equation: string): number;
/**
 * Check if the given value is a valid finite number.
 *
 * @param {*} val
 *
 * @returns {boolean} `true` if it is a finite number, `false` otherwise
 */
export function isNumeric(val: any): boolean;
/**
 * Check if the given value is a "safe" number.
 *
 * A "safe" number falls within the `Number.MAX_SAFE_INTEGER` and `Number.MIN_SAFE_INTEGER` values
 * (Inclusive).
 *
 * @param {*} val
 *
 * @returns {boolean} `true` if the value is a "safe" number, `false` otherwise
 */
export function isSafeNumber(val: any): boolean;
/**
 * Take an array of numbers and add the values together.
 *
 * @param {number[]} numbers
 *
 * @returns {number} The summed value
 */
export function sumArray(numbers: number[]): number;
/**
 * Round a number to the given amount of digits after the decimal point, removing any trailing
 * zeros after the decimal point.
 *
 * @example
 * toFixed(1.236, 2); // 1.24
 * toFixed(30.1, 2); // 30.1
 * toFixed(4.0000000004, 3); // 4
 *
 * @param {number} num The number to round
 * @param {number} [precision=0] The number of digits after the decimal point
 *
 * @returns {number}
 */
export function toFixed(num: number, precision?: number | undefined): number;
