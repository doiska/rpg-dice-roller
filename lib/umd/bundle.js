/**
 * @dice-roller/rpg-dice-roller - An advanced JS based dice roller that can roll various types of dice and modifiers, along with mathematical equations.
 * 
 * @version 5.4.1
 * @license MIT
 * @author GreenImp Media <info@greenimp.co.uk> (https://greenimp.co.uk)
 * @link https://dice-roller.github.io/documentation
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('mathjs'), require('random-js')) :
  typeof define === 'function' && define.amd ? define(['exports', 'mathjs', 'random-js'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.rpgDiceRoller = {}, global.math, global.Random));
})(this, (function (exports, mathjs, randomJs) { 'use strict';

  /**
   * An error thrown when a comparison operator is invalid
   */
  class CompareOperatorError extends TypeError {
    /**
     * Create a `CompareOperatorError`
     *
     * @param {*} operator The invalid operator
     */
    constructor(operator) {
      super(`Operator "${operator}" is invalid`);

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (TypeError.captureStackTrace) {
        TypeError.captureStackTrace(this, CompareOperatorError);
      }
      this.name = 'CompareOperatorError';
      this.operator = operator;
    }
  }

  /**
   * An error thrown when a data format is invalid
   */
  class DataFormatError extends Error {
    /**
     * Create a `DataFormatError`
     *
     * @param {*} data The invalid data
     */
    constructor(data) {
      super(`Invalid data format: ${data}`);

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DataFormatError);
      }
      this.name = 'ImportError';
      this.data = data;
    }
  }

  /**
   * An error thrown when an invalid die action (e.g. Exploding on a d1) occurs
   */
  class DieActionValueError extends Error {
    /**
     * Create a `DieActionValueError`
     *
     * @param {StandardDice} die The die the action was on
     * @param {string|null} [action=null] The invalid action
     */
    constructor(die) {
      let action = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      super(`Die "${die}" must have more than 1 possible value to ${action || 'do this action'}`);

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, DieActionValueError);
      }
      this.name = 'DieActionValueError';
      this.action = action;
      this.die = die;
    }
  }

  /**
   * An error thrown when the notation is invalid
   */
  class NotationError extends Error {
    /**
     * Create a `NotationError`
     *
     * @param {*} notation The invalid notation
     */
    constructor(notation) {
      super(`Notation "${notation}" is invalid`);

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, NotationError);
      }
      this.name = 'NotationError';
      this.notation = notation;
    }
  }

  /**
   * An error thrown when a required argument is missing
   */
  class RequiredArgumentError extends Error {
    /**
     * Create a `RequiredArgumentError`
     *
     * @param {string|null} [argumentName=null] The argument name
     */
    constructor() {
      let argumentName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      super(`Missing argument${argumentName ? ` "${argumentName}"` : ''}`);

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, RequiredArgumentError);
      }
      this.argumentName = argumentName;
    }
  }

  var index$3 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CompareOperatorError: CompareOperatorError,
    DataFormatError: DataFormatError,
    DieActionValueError: DieActionValueError,
    NotationError: NotationError,
    RequiredArgumentError: RequiredArgumentError
  });

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
  const compareNumbers = (a, b, operator) => {
    const aNum = Number(a);
    const bNum = Number(b);
    let result;
    if (Number.isNaN(aNum) || Number.isNaN(bNum)) {
      return false;
    }
    switch (operator) {
      case '=':
      case '==':
        result = aNum === bNum;
        break;
      case '<':
        result = aNum < bNum;
        break;
      case '>':
        result = aNum > bNum;
        break;
      case '<=':
        result = aNum <= bNum;
        break;
      case '>=':
        result = aNum >= bNum;
        break;
      case '!':
      case '!=':
      case '<>':
        result = aNum !== bNum;
        break;
      default:
        result = false;
        break;
    }
    return result;
  };

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
  const evaluate = equation => mathjs.evaluate(equation);

  /**
   * Check if the given value is a valid finite number.
   *
   * @param {*} val
   *
   * @returns {boolean} `true` if it is a finite number, `false` otherwise
   */
  const isNumeric = val => {
    if (typeof val !== 'number' && typeof val !== 'string') {
      return false;
    }
    return !Number.isNaN(val) && Number.isFinite(Number(val));
  };

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
  const isSafeNumber = val => {
    if (!isNumeric(val)) {
      return false;
    }
    const castVal = Number(val);
    return castVal <= Number.MAX_SAFE_INTEGER && castVal >= Number.MIN_SAFE_INTEGER;
  };

  /**
   * Take an array of numbers and add the values together.
   *
   * @param {number[]} numbers
   *
   * @returns {number} The summed value
   */
  const sumArray = numbers => !Array.isArray(numbers) ? 0 : numbers.reduce((prev, current) => prev + (isNumeric(current) ? parseFloat(`${current}`) : 0), 0);

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
  const toFixed = function (num) {
    let precision = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    return (
      // round to precision, then cast to a number to remove trailing zeroes after the decimal point
      parseFloat(parseFloat(`${num}`).toFixed(precision || 0))
    );
  };

  /**
   * The engine
   *
   * @type {symbol}
   *
   * @private
   */
  const engineSymbol = Symbol('engine');

  /**
   * The random object
   *
   * @type {symbol}
   *
   * @private
   */
  const randomSymbol = Symbol('random');

  /**
   * Engine that always returns the maximum value.
   * Used internally for calculating max roll values.
   *
   * @since 4.2.0
   *
   * @type {{next(): number, range: number[]}}
   */
  const maxEngine = {
    /**
     * The min / max number range (e.g. `[1, 10]`).
     *
     * This _must_ be set for the `next()` method to return the correct last index.
     *
     * @example
     * maxEngine.range = [1, 10];
     *
     * @type {number[]}
     */
    range: [],
    /**
     * Returns the maximum number index for the range
     *
     * @returns {number}
     */
    next() {
      // calculate the index of the max number
      return this.range[1] - this.range[0];
    }
  };

  /**
   * Engine that always returns the minimum value.
   * Used internally for calculating min roll values.
   *
   * @since 4.2.0
   *
   * @type {{next(): number}}
   */
  const minEngine = {
    /**
     * Returns the minimum number index, `0`
     *
     * @returns {number}
     */
    next() {
      return 0;
    }
  };

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
  const engines = {
    browserCrypto: randomJs.browserCrypto,
    nodeCrypto: randomJs.nodeCrypto,
    MersenneTwister19937: randomJs.MersenneTwister19937,
    nativeMath: randomJs.nativeMath,
    min: minEngine,
    max: maxEngine
  };

  /**
   * The `NumberGenerator` is capable of generating random numbers.
   *
   * @since 4.2.0
   *
   * @see This uses [random-js](https://github.com/ckknight/random-js).
   * For details of the engines, check the [documentation](https://github.com/ckknight/random-js#engines).
   */
  class NumberGenerator {
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
    constructor() {
      let engine = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : randomJs.nativeMath;
      this.engine = engine || randomJs.nativeMath;
    }

    /**
     * The current engine.
     *
     * @returns {Engine|{next(): number}}
     */
    get engine() {
      return this[engineSymbol];
    }

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
    set engine(engine) {
      if (engine && typeof engine.next !== 'function') {
        throw new TypeError('engine must have function `next()`');
      }

      // set the engine and re-initialise the random engine
      this[engineSymbol] = engine || randomJs.nativeMath;
      this[randomSymbol] = new randomJs.Random(this[engineSymbol]);
    }

    /**
     * Generate a random integer within the inclusive range `[min, max]`.
     *
     * @param {number} min The minimum integer value, inclusive.
     * @param {number} max The maximum integer value, inclusive.
     *
     * @returns {number} The random integer
     */
    integer(min, max) {
      this[engineSymbol].range = [min, max];
      return this[randomSymbol].integer(min, max);
    }

    /**
     * Returns a floating-point value within `[min, max)` or `[min, max]`.
     *
     * @param {number} min The minimum floating-point value, inclusive.
     * @param {number} max The maximum floating-point value.
     * @param {boolean} [inclusive=false] If `true`, `max` will be inclusive.
     *
     * @returns {number} The random floating-point value
     */
    real(min, max) {
      let inclusive = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      this[engineSymbol].range = [min, max];
      return this[randomSymbol].real(min, max, inclusive);
    }
  }
  const generator = new NumberGenerator();

  var NumberGenerator$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    engines: engines,
    generator: generator
  });

  const textSymbol = Symbol('text');
  const typeSymbol = Symbol('type');

  /**
   * Represents a Roll / Roll group description.
   */
  class Description {
    static types = {
      MULTILINE: 'multiline',
      INLINE: 'inline'
    };

    /**
     * Create a `Description` instance.
     *
     * @param {string} text
     * @param {string} [type=inline]
     */
    constructor(text) {
      let type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.constructor.types.INLINE;
      this.text = text;
      this.type = type;
    }

    /**
     * The description text.
     *
     * @return {string}
     */
    get text() {
      return this[textSymbol];
    }

    /**
     * Set the description text.
     *
     * @param {string|number} text
     */
    set text(text) {
      if (typeof text === 'object') {
        throw new TypeError('Description text is invalid');
      } else if (!text && text !== 0 || `${text}`.trim() === '') {
        throw new TypeError('Description text cannot be empty');
      }
      this[textSymbol] = `${text}`.trim();
    }

    /**
     * The description type.
     *
     * @return {string} "inline" or "multiline"
     */
    get type() {
      return this[typeSymbol];
    }

    /**
     * Set the description type.
     *
     * @param {string} type
     */
    set type(type) {
      const types = Object.values(this.constructor.types);
      if (typeof type !== 'string') {
        throw new TypeError('Description type must be a string');
      } else if (!types.includes(type)) {
        throw new RangeError(`Description type must be one of; ${types.join(', ')}`);
      }
      this[typeSymbol] = type;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @return {{text: string, type: string}}
     */
    toJSON() {
      const {
        text,
        type
      } = this;
      return {
        text,
        type
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @see {@link Description#text}
     *
     * @returns {string}
     */
    toString() {
      if (this.type === this.constructor.types.INLINE) {
        return `# ${this.text}`;
      }
      return `[${this.text}]`;
    }
  }

  const descriptionSymbol = Symbol('description');

  /**
   * A base class for description functionality.
   *
   * @abstract
   */
  class HasDescription {
    constructor() {
      let text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      this.description = text;
    }

    /**
     * The description for the group.
     *
     * @return {Description|null}
     */
    get description() {
      return this[descriptionSymbol] || null;
    }

    /**
     * Set the description on the group.
     *
     * @param {Description|string|null} description
     */
    set description(description) {
      if (!description && description !== 0) {
        this[descriptionSymbol] = null;
      } else if (description instanceof Description) {
        this[descriptionSymbol] = description;
      } else if (typeof description === 'string') {
        this[descriptionSymbol] = new Description(description);
      } else {
        throw new TypeError(`description must be of type Description, string or null. Received ${typeof description}`);
      }
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{description: (Description|null)}}
     */
    toJSON() {
      const {
        description
      } = this;
      return {
        description
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @see {@link RollGroup#notation}
     *
     * @returns {string}
     */
    toString() {
      if (this.description) {
        return `${this.description}`;
      }
      return '';
    }
  }

  /**
   * A `Modifier` is the base modifier class that all others extend from.
   *
   * @abstract
   */
  class Modifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 999;

    /**
     * Create a `Modifier` instance.
     */
    constructor() {
      // set the modifier's sort order
      this.order = this.constructor.order;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'modifier'
     */
    get name() {
      return 'modifier';
    }
    /* eslint-enable class-methods-use-this */

    /* eslint-disable class-methods-use-this */
    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return '';
    }
    /* eslint-enable class-methods-use-this */

    /* eslint-disable class-methods-use-this */
    /**
     * The maximum number of iterations that the modifier can apply to a single die roll
     *
     * @returns {number} `1000`
     */
    get maxIterations() {
      return 1000;
    }

    /**
     * No default values present
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {object}
     */
    defaults(_context) {
      return {};
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Processing default values definitions
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {void}
     */
    useDefaultsIfNeeded(_context) {
      Object.entries(this.defaults(_context)).forEach(_ref => {
        let [field, value] = _ref;
        if (typeof this[field] === 'undefined') {
          this[field] = value;
        }
      });
    }

    /* eslint-disable class-methods-use-this */
    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      this.useDefaultsIfNeeded(_context);
      return results;
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string}}
     */
    toJSON() {
      const {
        notation,
        name
      } = this;
      return {
        name,
        notation,
        type: 'modifier'
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @see {@link Modifier#notation}
     *
     * @returns {string}
     */
    toString() {
      return this.notation;
    }
  }

  const flags = {
    compound: '!',
    explode: '!',
    'critical-failure': '__',
    'critical-success': '**',
    drop: 'd',
    max: 'v',
    min: '^',
    penetrate: 'p',
    're-roll': 'r',
    're-roll-once': 'ro',
    'target-failure': '_',
    'target-success': '*',
    unique: 'u',
    'unique-once': 'uo'
  };

  /**
   * Return the flags for the given list of modifiers
   *
   * @param {...Modifier|string} modifiers
   *
   * @returns {string}
   */
  const getModifierFlags = function () {
    for (var _len = arguments.length, modifiers = new Array(_len), _key = 0; _key < _len; _key++) {
      modifiers[_key] = arguments[_key];
    }
    return (
      // @todo need a better way of mapping modifiers to symbols
      [...modifiers].reduce((acc, modifier) => {
        let name;
        if (modifier instanceof Modifier) {
          name = modifier.name;
        } else {
          name = modifier;
        }
        return acc + (flags[name] || name);
      }, '')
    );
  };

  const calculationValueSymbol$1 = Symbol('calculation-value');
  const modifiersSymbol$3 = Symbol('modifiers');
  const initialValueSymbol = Symbol('initial-value');
  const useInTotalSymbol$1 = Symbol('use-in-total');
  const valueSymbol$1 = Symbol('value');
  const diceSymbol = Symbol('dice');

  /**
   * A `RollResult` represents the value and applicable modifiers for a single die roll
   *
   * ::: tip
   * You will probably not need to create your own `RollResult` instances, unless you're importing
   * rolls, but `RollResult` objects will be returned when rolling dice.
   * :::
   */
  class RollResult {
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
    constructor(value) {
      let modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      let useInTotal = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      if (isNumeric(value)) {
        this[initialValueSymbol] = Number(value);
        this.modifiers = modifiers || [];
        this.useInTotal = useInTotal;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // ensure that we have a valid value
        const initialVal = isNumeric(value.initialValue) ? value.initialValue : value.value;
        if (!isNumeric(initialVal)) {
          throw new TypeError(`Result value is invalid: ${initialVal}`);
        }
        this[initialValueSymbol] = Number(initialVal);
        if (isNumeric(value.value) && Number(value.value) !== this[initialValueSymbol]) {
          this.value = value.value;
        }
        if (isNumeric(value.calculationValue) && parseFloat(`${value.calculationValue}`) !== this.value) {
          this.calculationValue = value.calculationValue;
        }
        this.modifiers = value.modifiers || modifiers || [];
        this.useInTotal = typeof value.useInTotal === 'boolean' ? value.useInTotal : useInTotal || false;
      } else if (value === Infinity) {
        throw new RangeError('Result value must be a finite number');
      } else {
        throw new TypeError(`Result value is invalid: ${value}`);
      }
    }

    /**
     * The value to use in calculations.
     * This may be changed by modifiers.
     *
     * @returns {number}
     */
    get calculationValue() {
      return isNumeric(this[calculationValueSymbol$1]) ? parseFloat(this[calculationValueSymbol$1]) : this.value;
    }

    /**
     * Set the value to use in calculations.
     *
     * @param {number} value
     *
     * @throws {TypeError} value is invalid
     */
    set calculationValue(value) {
      const isValNumeric = isNumeric(value);
      if (value === Infinity) {
        throw new RangeError('Result calculation value must be a finite number');
      }
      if (value && !isValNumeric) {
        throw new TypeError(`Result calculation value is invalid: ${value}`);
      }
      this[calculationValueSymbol$1] = isValNumeric ? parseFloat(`${value}`) : null;
    }

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
    get initialValue() {
      return this[initialValueSymbol];
    }

    /**
     * The visual flags for the modifiers that affect the roll.
     *
     * @see {@link RollResult#modifiers}
     *
     * @returns {string}
     */
    get modifierFlags() {
      return getModifierFlags(...this.modifiers);
    }

    /**
     * The names of modifiers that affect the roll.
     *
     * @returns {Set<string>}
     */
    get modifiers() {
      return this[modifiersSymbol$3];
    }

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
    set modifiers(value) {
      if ((Array.isArray(value) || value instanceof Set) && [...value].every(item => typeof item === 'string')) {
        this[modifiersSymbol$3] = new Set([...value]);
        return;
      }
      if (!value && value !== 0) {
        // clear the modifiers
        this[modifiersSymbol$3] = new Set();
        return;
      }
      throw new TypeError(`modifiers must be a Set or array of modifier names: ${value}`);
    }

    /**
     * Whether to use the value in total calculations or not.
     *
     * @returns {boolean}
     */
    get useInTotal() {
      return !!this[useInTotalSymbol$1];
    }

    /**
     * Set whether to use the value in total calculations or not.
     *
     * @param {boolean} value
     */
    set useInTotal(value) {
      this[useInTotalSymbol$1] = !!value;
    }

    /**
     * Value of the roll after modifiers have been applied.
     *
     * @returns {number}
     */
    get value() {
      return isNumeric(this[valueSymbol$1]) ? this[valueSymbol$1] : this[initialValueSymbol];
    }

    /**
     * Set the roll value.
     *
     * @param {number} value
     *
     * @throws {RangeError} value must be finite
     * @throws {TypeError} value is invalid
     */
    set value(value) {
      if (value === Infinity) {
        throw new RangeError('Result value must be a finite number');
      }
      if (!isNumeric(value)) {
        throw new TypeError(`Result value is invalid: ${value}`);
      }
      this[valueSymbol$1] = Number(value);
    }
    get dice() {
      return this[diceSymbol];
    }
    set dice(value) {
      this[diceSymbol] = value;
    }

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
    toJSON() {
      const {
        calculationValue,
        initialValue,
        modifierFlags,
        modifiers,
        useInTotal,
        value
      } = this;
      return {
        calculationValue,
        initialValue,
        modifierFlags,
        modifiers: [...modifiers],
        type: 'result',
        useInTotal,
        value
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     */
    toString() {
      return this.value + this.modifierFlags;
    }
  }

  const rollsSymbol$1 = Symbol('rolls');

  /**
   * A collection of die roll results
   *
   * ::: tip
   * You will probably not need to create your own `RollResults` instances, unless you're importing
   * rolls, but RollResults objects will be returned when rolling dice.
   * :::
   */
  class RollResults {
    /**
     * Create a `RollResults` instance.
     *
     * @example <caption>`RollResult` objects</caption>
     * const results = new RollResults([
     *  new RollResult(4),
     *  new RollResult(3),
     *  new RollResult(5),
     * ]);
     *
     * @example <caption>Numerical results</caption>
     * const results = new RollResults([4, 3, 5]);
     *
     * @example <caption>A mix</caption>
     * const results = new RollResults([
     *  new RollResult(4),
     *  3,
     *  new RollResult(5),
     * ]);
     *
     * @param {Array.<RollResult|number>} [rolls=[]] The roll results
     *
     * @throws {TypeError} Rolls must be an array
     */
    constructor() {
      let rolls = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      this.rolls = rolls;
    }

    /**
     * The number of roll results.
     *
     * @returns {number}
     */
    get length() {
      return this.rolls.length || 0;
    }

    /**
     * List of roll results.
     *
     * @returns {RollResult[]}
     */
    get rolls() {
      return [...this[rollsSymbol$1]];
    }

    /**
     * Set the rolls.
     *
     * @param {RollResult[]|number[]} rolls
     *
     * @throws {TypeError} Rolls must be an array
     */
    set rolls(rolls) {
      if (!rolls || !Array.isArray(rolls)) {
        // roll is not an array
        throw new TypeError(`rolls must be an array: ${rolls}`);
      }

      // loop through each result and add it to the rolls list
      this[rollsSymbol$1] = [];
      rolls.forEach(result => {
        this.addRoll(result);
      });
    }

    /**
     * The total value of all the rolls after modifiers have been applied.
     *
     * @returns {number}
     */
    get value() {
      return this.rolls.reduce((v, roll) => v + (roll.useInTotal ? roll.calculationValue : 0), 0);
    }

    /**
     * Add a single roll to the list.
     *
     * @param {RollResult|number} value
     */
    addRoll(value) {
      const result = value instanceof RollResult ? value : new RollResult(value);
      this[rollsSymbol$1].push(result);
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{rolls: RollResult[], value: number}}
     */
    toJSON() {
      const {
        rolls,
        value
      } = this;
      return {
        rolls,
        type: 'roll-results',
        value
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     */
    toString() {
      return `[${this.rolls.join(', ')}]`;
    }
  }

  const modifiersSymbol$2 = Symbol('modifiers');
  const qtySymbol$1 = Symbol('qty');
  const sidesSymbol = Symbol('sides');
  const minSymbol$1 = Symbol('min-value');
  const maxSymbol$1 = Symbol('max-value');

  /**
   * Represents a standard numerical die.
   */
  class StandardDice extends HasDescription {
    /**
     * Create a `StandardDice` instance.
     *
     * @param {number} sides The number of sides the die has (.e.g `6`)
     * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
     * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
     * @param {number|null} [min=1] The minimum possible roll value
     * @param {number|null} [max=null] The maximum possible roll value. Defaults to number of `sides`
     * @param {Description|string|null} [description=null] The roll description.
     *
     * @throws {RequiredArgumentError} sides is required
     * @throws {TypeError} qty must be a positive integer, and modifiers must be valid
     */
    constructor(sides) {
      let qty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      let modifiers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      let min = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
      let max = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
      let description = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
      super(description);
      if (!sides && sides !== 0) {
        throw new RequiredArgumentError('sides');
      } else if (sides === Infinity) {
        throw new RangeError('numerical sides must be finite number');
      } else if (isNumeric(sides)) {
        if (sides < 1 || !isSafeNumber(sides)) {
          throw new RangeError('numerical sides must be a positive finite number');
        }
      } else if (typeof sides !== 'string') {
        throw new TypeError('non-numerical sides must be a string');
      }
      if (!isNumeric(qty)) {
        throw new TypeError('qty must be a positive finite integer');
      } else if (qty < 1 || qty > 999) {
        throw new RangeError('qty must be between 1 and 999');
      }
      let minVal = min;
      if (minVal === null || minVal === undefined) {
        minVal = 1;
      } else if (!isNumeric(minVal)) {
        throw new TypeError('min must a finite number');
      } else if (!isSafeNumber(minVal)) {
        throw new RangeError('min must a finite number');
      }
      if (max && !isNumeric(max)) {
        throw new TypeError('max must a finite number');
      } else if (max && !isSafeNumber(max)) {
        throw new RangeError('max must a finite number');
      }
      this[qtySymbol$1] = parseInt(`${qty}`, 10);
      this[sidesSymbol] = sides;
      if (modifiers) {
        this.modifiers = modifiers;
      }
      this[minSymbol$1] = parseInt(minVal, 10);
      this[maxSymbol$1] = max ? parseInt(`${max}`, 10) : sides;
    }

    /**
     * The average value that the die can roll (Excluding modifiers).
     *
     * @returns {number}
     */
    get average() {
      return (this.min + this.max) / 2;
    }

    /**
     * The modifiers that affect this die roll.
     *
     * @returns {Map<string, Modifier>|null}
     */
    get modifiers() {
      if (this[modifiersSymbol$2]) {
        // ensure modifiers are ordered correctly
        return new Map([...this[modifiersSymbol$2]].sort((a, b) => a[1].order - b[1].order));
      }
      return null;
    }

    /**
     * Set the modifiers that affect this roll.
     *
     * @param {Map<string, Modifier>|Modifier[]|{}|null} value
     *
     * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
     */
    set modifiers(value) {
      let modifiers;
      if (value instanceof Map) {
        modifiers = value;
      } else if (Array.isArray(value)) {
        // loop through and get the modifier name of each item and use it as the map key
        modifiers = new Map(value.map(modifier => [modifier.name, modifier]));
      } else if (typeof value === 'object') {
        modifiers = new Map(Object.entries(value));
      } else {
        throw new TypeError('modifiers should be a Map, array, or an Object containing Modifiers');
      }
      if (modifiers.size && [...modifiers.entries()].some(entry => !(entry[1] instanceof Modifier))) {
        throw new TypeError('modifiers must only contain Modifier instances');
      }
      this[modifiersSymbol$2] = modifiers;
    }

    /**
     * The maximum value that can be rolled on the die, excluding modifiers.
     *
     * @returns {number}
     */
    get max() {
      return this[maxSymbol$1];
    }

    /**
     * The minimum value that can be rolled on the die, excluding modifiers.
     *
     * @returns {number}
     */
    get min() {
      return this[minSymbol$1];
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the die.
     *
     * @returns {string} 'standard'
     */
    get name() {
      return 'standard';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The dice notation. e.g. `4d6!`.
     *
     * @returns {string}
     */
    get notation() {
      let notation = `${this.qty}d${this.sides}`;
      if (this.modifiers && this.modifiers.size) {
        notation += [...this.modifiers.values()].reduce((acc, modifier) => acc + modifier.notation, '');
      }
      return notation;
    }

    /**
     * The number of dice that should be rolled.
     *
     * @returns {number}
     */
    get qty() {
      return this[qtySymbol$1];
    }

    /**
     * The number of sides the die has.
     *
     * @returns {number}
     */
    get sides() {
      return this[sidesSymbol];
    }

    /**
     * Roll the dice for the specified quantity and apply any modifiers.
     *
     * @returns {RollResults} The result of the roll
     */
    roll() {
      // create a result object to hold the rolls
      const rollResult = new RollResults();

      // loop for the quantity and roll the die
      for (let i = 0; i < this.qty; i++) {
        // add the rolls to the list
        rollResult.addRoll(this.rollOnce());
      }

      // loop through each modifier and carry out its actions
      (this.modifiers || []).forEach(modifier => {
        modifier.run(rollResult, this);
      });
      return rollResult;
    }

    /**
     * Roll a single die and return the value.
     *
     * @returns {RollResult} The value rolled
     */
    rollOnce() {
      const result = new RollResult(generator.integer(this.min, this.max));
      result.dice = this;
      return result;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  average: number,
     *  min: number,
     *  max: number,
     *  notation: string,
     *  qty: number,
     *  name: string,
     *  sides: number,
     *  modifiers: (Map<string, Modifier>|null),
     *  type: string
     * }}
     */
    toJSON() {
      const {
        average,
        max,
        min,
        modifiers,
        name,
        notation,
        qty,
        sides
      } = this;
      return Object.assign(super.toJSON(), {
        average,
        max,
        min,
        modifiers,
        name,
        notation,
        qty,
        sides,
        type: 'die'
      });
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @see {@link StandardDice#notation}
     *
     * @returns {string}
     */
    toString() {
      return `${this.notation}${this.description ? ` ${this.description}` : ''}`;
    }
  }

  /**
   * Represents a Fudge / Fate type die.
   *
   * @extends StandardDice
   */
  class FudgeDice extends StandardDice {
    /**
     * Create a `FudgeDice` instance.
     *
     * @param {number} [nonBlanks=2] The number of sides each symbol should cover (`1` or `2`)
     * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
     * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
     * @param {Description|string|null} [description=null] The roll description.
     *
     * @throws {RangeError} nonBlanks must be 1 or 2
     * @throws {TypeError} modifiers must be valid
     */
    constructor() {
      let nonBlanks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 2;
      let qty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      let modifiers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      let description = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      let numNonBlanks = nonBlanks;
      if (!numNonBlanks && numNonBlanks !== 0) {
        numNonBlanks = 2;
      } else if (numNonBlanks !== 1 && numNonBlanks !== 2) {
        throw new RangeError('nonBlanks must be 1 or 2');
      }
      super(numNonBlanks, qty, modifiers, -1, 1, description);
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the die.
     *
     * @returns {string} 'fudge'
     */
    get name() {
      return 'fudge';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The number of sides that each symbol (+, -) covers.
     *
     * @returns {number} `1` or `2`
     */
    get nonBlanks() {
      return super.sides;
    }

    /**
     * The number of sides the die has.
     *
     * @returns {string} 'F.2' or 'F.1'
     */
    get sides() {
      return `F.${this.nonBlanks}`;
    }

    /**
     * Roll a single die and return the value.
     *
     * @returns {RollResult} The value rolled
     */
    rollOnce() {
      let total = 0;
      if (this.nonBlanks === 2) {
        // default fudge (2 of each non-blank) = 1d3 - 2
        total = generator.integer(1, 3) - 2;
      } else if (this.nonBlanks === 1) {
        // only 1 of each non-blank
        // on 1d6 a roll of 1 = -1, 6 = +1, others = 0
        const num = generator.integer(1, 6);
        if (num === 1) {
          total = -1;
        } else if (num === 6) {
          total = 1;
        }
      }
      return new RollResult(total);
    }
  }

  /**
   * Represents a percentile die.
   *
   * @extends StandardDice
   */
  class PercentileDice extends StandardDice {
    /**
     * Create a `PercentileDice` instance.
     *
     * @param {number} [qty=1] The number of dice to roll (e.g. `4`)
     * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers] The modifiers that affect the die
     * @param {boolean} [sidesAsNumber=false] Whether to show the sides as `%` (default) or `100`
     * @param {Description|string|null} [description=null] The roll description.
     *
     * @throws {TypeError} qty must be a positive integer, and modifiers must be valid
     */
    constructor() {
      let qty = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      let modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      let sidesAsNumber = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      let description = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
      super(100, qty, modifiers, null, null, description);
      this.sidesAsNumber = !!sidesAsNumber;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the die.
     *
     * @returns {string} 'percentile'
     */
    get name() {
      return 'percentile';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The number of sides the die has
     *
     * @returns {number|string} `%` if `sidesAsNumber == false`, or `100` otherwise
     */
    get sides() {
      return this.sidesAsNumber ? super.sides : '%';
    }
  }

  var index$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    FudgeDice: FudgeDice,
    PercentileDice: PercentileDice,
    StandardDice: StandardDice
  });

  /**
   * The operator
   *
   * @type {symbol}
   *
   * @private
   */
  const operatorSymbol = Symbol('operator');

  /**
   * The value
   *
   * @type {symbol}
   *
   * @private
   */
  const valueSymbol = Symbol('value');

  /**
   * A `ComparePoint` object compares numbers against each other.
   * For example, _is 6 greater than 3_, or _is 8 equal to 10_.
   */
  class ComparePoint {
    /**
     * Create a `ComparePoint` instance.
     *
     * @param {string} operator The comparison operator (One of `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`)
     * @param {number} value The value to compare to
     *
     * @throws {CompareOperatorError} operator is invalid
     * @throws {RequiredArgumentError} operator and value are required
     * @throws {TypeError} value must be numeric
     */
    constructor(operator, value) {
      if (!operator) {
        throw new RequiredArgumentError('operator');
      } else if (!value && value !== 0) {
        throw new RequiredArgumentError('value');
      }
      this.operator = operator;
      this.value = value;
    }

    /**
     * Check if the operator is valid.
     *
     * @param {string} operator
     *
     * @returns {boolean} `true` if the operator is valid, `false` otherwise
     */
    static isValidOperator(operator) {
      return typeof operator === 'string' && /^(?:[<>!]?=|[<>]|<>)$/.test(operator);
    }

    /**
     * Set the comparison operator.
     *
     * @param {string} operator One of `=`, `!=`, `<>`, `<`, `>`, `<=`, `>=`
     *
     * @throws CompareOperatorError operator is invalid
     */
    set operator(operator) {
      if (!this.constructor.isValidOperator(operator)) {
        throw new CompareOperatorError(operator);
      }
      this[operatorSymbol] = operator;
    }

    /**
     * The comparison operator.
     *
     * @returns {string}
     */
    get operator() {
      return this[operatorSymbol];
    }

    /**
     * Set the value.
     *
     * @param {number} value
     *
     * @throws {TypeError} value must be numeric
     */
    set value(value) {
      if (!isNumeric(value)) {
        throw new TypeError('value must be a finite number');
      }
      this[valueSymbol] = Number(value);
    }

    /**
     * The comparison value
     *
     * @returns {number}
     */
    get value() {
      return this[valueSymbol];
    }

    /**
     * Check whether value matches the compare point
     *
     * @param {number} value The number to compare
     *
     * @returns {boolean} `true` if it is a match, `false` otherwise
     */
    isMatch(value) {
      return compareNumbers(value, this.value, this.operator);
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{type: string, value: number, operator: string}}
     */
    toJSON() {
      const {
        operator,
        value
      } = this;
      return {
        operator,
        type: 'compare-point',
        value
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     */
    toString() {
      return `${this.operator}${this.value}`;
    }
  }

  const comparePointSymbol = Symbol('compare-point');

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
  class ComparisonModifier extends Modifier {
    /**
     * Create a `ComparisonModifier` instance.
     *
     * @param {ComparePoint} [comparePoint] The comparison object
     *
     * @throws {TypeError} `comparePoint` must be an instance of `ComparePoint` or `undefined`
     */
    constructor(comparePoint) {
      super();
      if (comparePoint) {
        this.comparePoint = comparePoint;
      }
    }

    /**
     * The compare point.
     *
     * @returns {ComparePoint|undefined}
     */
    get comparePoint() {
      return this[comparePointSymbol];
    }

    /**
     * Set the compare point.
     *
     * @param {ComparePoint} comparePoint
     *
     * @throws {TypeError} value must be an instance of `ComparePoint`
     */
    set comparePoint(comparePoint) {
      if (!(comparePoint instanceof ComparePoint)) {
        throw new TypeError('comparePoint must be instance of ComparePoint');
      }
      this[comparePointSymbol] = comparePoint;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'comparison'
     */
    get name() {
      return 'comparison';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `${this.comparePoint || ''}`;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * Empty default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {null}
     */
    defaultComparePoint(_context) {
      return {};
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Eases processing of simple "compare point only" defaults
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {object}
     */
    defaults(_context) {
      const comparePointConfig = this.defaultComparePoint(_context);
      if (typeof comparePointConfig === 'object' && comparePointConfig.length === 2) {
        return {
          comparePoint: new ComparePoint(...comparePointConfig)
        };
      }
      return {};
    }

    /**
     * Check whether value matches the compare point or not.
     *
     * @param {number} value The value to compare with
     *
     * @returns {boolean} `true` if the value matches, `false` otherwise
     */
    isComparePoint(value) {
      if (!this.comparePoint) {
        return false;
      }
      return this.comparePoint.isMatch(value);
    }

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
    toJSON() {
      const {
        comparePoint
      } = this;
      return Object.assign(super.toJSON(), {
        comparePoint
      });
    }
  }

  /* eslint-disable no-useless-constructor */

  /**
   * A `CriticalFailureModifier` modifier flags values that match a comparison.
   *
   * Unlike most other modifiers, it doesn't affect the roll value, it simply "flags" matching rolls.
   *
   * @see {@link CriticalSuccessModifier} for the opposite of this modifier
   *
   * @extends ComparisonModifier
   */
  class CriticalFailureModifier extends ComparisonModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 10;

    /**
     * Create a `CriticalFailureModifier` instance.
     *
     * @param {ComparePoint} [comparePoint] The comparison object
     *
     * @throws {TypeError} comparePoint must be a `ComparePoint` object
     */
    constructor(comparePoint) {
      super(comparePoint);
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'critical-failure'
     */
    get name() {
      return 'critical-failure';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `cf${super.notation}`;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {array}
     */
    defaultComparePoint(_context) {
      return ['=', _context.min];
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      super.run(results, _context);
      results.rolls.forEach(roll => {
        // add the modifier flag
        if (this.isComparePoint(roll.value)) {
          roll.modifiers.add('critical-failure');
        }
        return roll;
      });
      return results;
    }
  }

  /* eslint-disable no-useless-constructor */

  /**
   * A `CriticalSuccessModifier` modifier flags values that match a comparison.
   *
   * Unlike most other modifiers, it doesn't affect the roll value, it simply "flags" matching rolls.
   *
   * @see {@link CriticalFailureModifier} for the opposite of this modifier
   *
   * @extends ComparisonModifier
   */
  class CriticalSuccessModifier extends ComparisonModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 9;

    /**
     * Create a `CriticalSuccessModifier` instance.
     *
     * @param {ComparePoint} comparePoint The comparison object
     *
     * @throws {TypeError} comparePoint must be a `ComparePoint` object
     */
    constructor(comparePoint) {
      super(comparePoint);
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'critical-success'
     */
    get name() {
      return 'critical-success';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `cs${super.notation}`;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {array}
     */
    defaultComparePoint(_context) {
      return ['=', _context.max];
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Runs the modifier on the rolls.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults}
     */
    run(results, _context) {
      super.run(results, _context);

      // loop through each roll and see if it's a critical success
      results.rolls.forEach(roll => {
        // add the modifier flag
        if (this.isComparePoint(roll.value)) {
          roll.modifiers.add('critical-success');
        }
        return roll;
      });
      return results;
    }
  }

  const calculationValueSymbol = Symbol('calculation-value');
  const isRollGroupSymbol = Symbol('is-roll-group');
  const modifiersSymbol$1 = Symbol('modifiers');
  const resultsSymbol = Symbol('results');
  const useInTotalSymbol = Symbol('use-in-total');

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
  class ResultGroup {
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
    constructor() {
      let results = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      let modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      let isRollGroup = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      let useInTotal = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      this.isRollGroup = isRollGroup;
      this.modifiers = modifiers;
      this.results = results;
      this.useInTotal = useInTotal;
    }

    /**
     * The value to use in calculations.
     * This may be changed by modifiers.
     *
     * @returns {number}
     */
    get calculationValue() {
      return isNumeric(this[calculationValueSymbol]) ? parseFloat(this[calculationValueSymbol]) : this.value;
    }

    /**
     * Set the value to use in calculations.
     *
     * @param {number} value
     *
     * @throws {TypeError} value is invalid
     */
    set calculationValue(value) {
      const isValNumeric = isNumeric(value);
      if (value === Infinity) {
        throw new RangeError('Results calculation value must be a finite number');
      }
      if (value && !isValNumeric) {
        throw new TypeError(`Results calculation value is invalid: ${value}`);
      }
      this[calculationValueSymbol] = isValNumeric ? parseFloat(`${value}`) : null;
    }

    /**
     * Whether the result group represents a roll group or not.
     *
     * @returns {boolean} `true` if it is a roll group, `false` otherwise
     */
    get isRollGroup() {
      return this[isRollGroupSymbol];
    }

    /**
     * Set whether the result group represents a roll group or not.
     *
     * @param {boolean} value
     */
    set isRollGroup(value) {
      this[isRollGroupSymbol] = !!value;
    }

    /**
     * The number of results.
     *
     * @returns {number}
     */
    get length() {
      return this.results.length || 0;
    }

    /**
     * The visual flags for the modifiers that affect the group.
     *
     * @see {@link ResultGroup#modifiers}
     *
     * @returns {string}
     */
    get modifierFlags() {
      return getModifierFlags(...this.modifiers);
    }

    /**
     * The modifier names that affect the group.
     *
     * @returns {Set<string>}
     */
    get modifiers() {
      return this[modifiersSymbol$1];
    }

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
    set modifiers(value) {
      if ((Array.isArray(value) || value instanceof Set) && [...value].every(item => typeof item === 'string')) {
        this[modifiersSymbol$1] = new Set([...value]);
      } else if (!value && value !== 0) {
        // clear the modifiers
        this[modifiersSymbol$1] = new Set();
      } else {
        throw new TypeError(`modifiers must be a Set or array of modifier names: ${value}`);
      }
    }

    /**
     * List of results.
     *
     * @returns {Array.<ResultGroup|RollResults|number|string>}
     */
    get results() {
      return [...this[resultsSymbol]];
    }

    /**
     * Set the results.
     *
     * @param {Array.<ResultGroup|RollResults|number|string>} results
     *
     * @throws {TypeError} Results must be an array
     */
    set results(results) {
      if (!results || !Array.isArray(results)) {
        // results is not an array
        throw new TypeError(`results must be an array: ${results}`);
      }

      // loop through each result and add it to the results list
      this[resultsSymbol] = [];
      results.forEach(result => {
        this.addResult(result);
      });
    }

    /**
     * Whether to use the value in total calculations or not.
     *
     * @returns {boolean}
     */
    get useInTotal() {
      return !!this[useInTotalSymbol];
    }

    /**
     * Set whether to use the value in total calculations or not.
     *
     * @param {boolean} value
     */
    set useInTotal(value) {
      this[useInTotalSymbol] = !!value;
    }

    /**
     * The total value of all the results after modifiers have been applied.
     *
     * @returns {number}
     */
    get value() {
      if (!this.results.length) {
        return 0;
      }

      // loop through the results
      // - get the values of result objects and add any operators and plain numbers
      // we'll either end up with a numerical total (If all results are result objects or numbers)
      // or a string equation (If there are operators)
      const value = this.results.reduce((v, result) => {
        let val = result;
        if (result instanceof ResultGroup) {
          val = result.useInTotal ? result.calculationValue : 0;
        } else if (result instanceof RollResults) {
          val = result.value;
        }
        return v + val;
      }, typeof this.results[0] === 'string' ? '' : 0);

      // if value is a string that means operators were included, so we need to evaluate the equation
      if (typeof value === 'string') {
        return evaluate(value);
      }
      return value;
    }

    /**
     * Add a single result to the list.
     *
     * @param {ResultGroup|RollResults|number|string} value
     *
     * @throws {TypeError} Value type is invalid
     */
    addResult(value) {
      let val;
      if (value instanceof ResultGroup || value instanceof RollResults) {
        // already a valid result object
        val = value;
      } else if (typeof value === 'string' || isNumeric(value)) {
        // string operator (e.g. '+', '/', etc.), or plain number
        val = value;
      } else {
        throw new TypeError('value must be one of ResultGroup, RollResults, string, or number');
      }

      // add the result to the list
      this[resultsSymbol].push(val);
    }

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
    toJSON() {
      const {
        calculationValue,
        isRollGroup,
        modifierFlags,
        modifiers,
        results,
        useInTotal,
        value
      } = this;
      return {
        calculationValue,
        isRollGroup,
        modifierFlags,
        modifiers: [...modifiers],
        results,
        type: 'result-group',
        useInTotal,
        value
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     */
    toString() {
      let output;
      if (this.isRollGroup) {
        output = `{${this.results.join(', ')}}`;
      } else {
        output = this.results.join('');
      }
      if (this.modifierFlags) {
        output = `(${output})${this.modifierFlags}`;
      }
      return output;
    }
  }

  const endSymbol = Symbol('end');
  const qtySymbol = Symbol('qty');

  /**
   * A `KeepModifier` will "keep" dice from a roll, dropping (Remove from total calculations) all
   * others.
   *
   * @see {@link DropModifier} for the opposite of this modifier
   *
   * @extends Modifier
   */
  class KeepModifier extends Modifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 6;

    /**
     * Create a `KeepModifier` instance
     *
     * @param {string} [end=h] Either `h|l` to keep highest or lowest
     * @param {number} [qty=1] The amount dice to keep
     *
     * @throws {RangeError} End must be one of 'h' or 'l'
     * @throws {TypeError} qty must be a positive integer
     */
    constructor() {
      let end = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'h';
      let qty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      super();
      this.end = end;
      this.qty = qty;
    }

    /**
     * Which end the rolls should be kept ("h" = High, "l" = Low).
     *
     * @returns {string} 'h' or 'l'
     */
    get end() {
      return this[endSymbol];
    }

    /**
     * Set which end the rolls should be kept ("h" = High, "l" = Low).
     *
     * @param {string} value Either 'h' or 'l'
     *
     * @throws {RangeError} End must be one of 'h' or 'l'
     */
    set end(value) {
      if (value !== 'h' && value !== 'l') {
        throw new RangeError('End must be "h" or "l"');
      }
      this[endSymbol] = value;
    }

    /**
     * The name of the modifier.
     *
     * @returns {string} 'keep-l' or 'keep-h'
     */
    get name() {
      return `keep-${this.end}`;
    }

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `k${this.end}${this.qty}`;
    }

    /**
     * The quantity of dice that should be kept.
     *
     * @returns {number}
     */
    get qty() {
      return this[qtySymbol];
    }

    /**
     * Set the quantity of dice that should be kept.
     *
     * @param {number} value
     *
     * @throws {TypeError} qty must be a positive finite integer
     */
    set qty(value) {
      if (value === Infinity) {
        throw new RangeError('qty must be a finite number');
      }
      if (!isNumeric(value) || value < 1) {
        throw new TypeError('qty must be a positive finite integer');
      }
      this[qtySymbol] = Math.floor(value);
    }

    /**
     * Determine the start and end (end exclusive) range of rolls to drop.
     *
     * @param {RollResults} _results The results to drop from
     *
     * @returns {number[]} The min / max range to drop
     */
    rangeToDrop(_results) {
      // we're keeping, so we want to drop all dice that are outside of the qty range
      if (this.end === 'h') {
        return [0, _results.length - this.qty];
      }
      return [this.qty, _results.length];
    }

    /**
     * Run the modifier on the results.
     *
     * @param {ResultGroup|RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {ResultGroup|RollResults} The modified results
     */
    run(results, _context) {
      let modifiedRolls;
      let rollIndexes;
      if (results instanceof ResultGroup) {
        modifiedRolls = results.results;
        if (modifiedRolls.length === 1 && modifiedRolls[0] instanceof ResultGroup) {
          // single sub-roll - get all the dice rolled and their 2d indexes
          rollIndexes = modifiedRolls[0].results.map((result, index) => {
            if (result instanceof RollResults) {
              return result.rolls.map((subResult, subIndex) => ({
                value: subResult.value,
                index: [index, subIndex]
              }));
            }
            return null;
          }).flat().filter(Boolean);
        } else {
          rollIndexes = [...modifiedRolls]
          // get a list of objects with roll values and original index
          .map((roll, index) => ({
            value: roll.value,
            index
          }));
        }
      } else {
        modifiedRolls = results.rolls;
        rollIndexes = [...modifiedRolls]
        // get a list of objects with roll values and original index
        .map((roll, index) => ({
          value: roll.value,
          index
        }));
      }

      // determine the indexes that need to be dropped
      rollIndexes = rollIndexes
      // sort the list ascending by value
      .sort((a, b) => a.value - b.value).map(rollIndex => rollIndex.index)
      // get the roll indexes to drop
      .slice(...this.rangeToDrop(rollIndexes));

      // loop through all of our dice to drop and flag them as such
      rollIndexes.forEach(rollIndex => {
        let roll;
        if (Array.isArray(rollIndex)) {
          // array of indexes (e.g. single sub-roll in a group roll)
          roll = modifiedRolls[0].results[rollIndex[0]].rolls[rollIndex[1]];
        } else {
          roll = modifiedRolls[rollIndex];
        }
        roll.modifiers.add('drop');
        roll.useInTotal = false;
      });
      return results;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string, qty: number, end: string}}
     */
    toJSON() {
      const {
        end,
        qty
      } = this;
      return Object.assign(super.toJSON(), {
        end,
        qty
      });
    }
  }

  /**
   * A `DropModifier` will "drop" (Remove from total calculations) dice from a roll.
   *
   * @see {@link KeepModifier} for the opposite of this modifier
   *
   * @extends KeepModifier
   */
  class DropModifier extends KeepModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 7;

    /**
     * Create a `DropModifier` instance.
     *
     * @param {string} [end=l] Either `h|l` to drop highest or lowest
     * @param {number} [qty=1] The amount of dice to drop
     *
     * @throws {RangeError} End must be one of 'h' or 'l'
     * @throws {TypeError} qty must be a positive integer
     */
    constructor() {
      let end = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'l';
      let qty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
      super(end, qty);
    }

    /**
     * The name of the modifier.
     *
     * @returns {string} 'drop-l' or 'drop-h'
     */
    get name() {
      return `drop-${this.end}`;
    }

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `d${this.end}${this.qty}`;
    }

    /**
     * Determine the start and end (end exclusive) range of rolls to drop.
     *
     * @param {RollResults} _results The results to drop from
     *
     * @returns {number[]} The min / max range to drop
     */
    rangeToDrop(_results) {
      // we're dropping, so we want to drop all dice that are inside of the qty range
      if (this.end === 'h') {
        return [_results.length - this.qty, _results.length];
      }
      return [0, this.qty];
    }
  }

  const compoundSymbol = Symbol('compound');
  const penetrateSymbol = Symbol('penetrate');

  /**
   * An `ExplodeModifier` re-rolls dice that match a given test, and adds them to the results.
   *
   * @see {@link ReRollModifier} if you want to replace the old value with the new, rather than adding
   *
   * @extends ComparisonModifier
   */
  class ExplodeModifier extends ComparisonModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 3;

    /**
     * Create an `ExplodeModifier` instance
     *
     * @param {ComparePoint} [comparePoint=null] The comparison object
     * @param {boolean} [compound=false] Whether to compound or not
     * @param {boolean} [penetrate=false] Whether to penetrate or not
     *
     * @throws {TypeError} comparePoint must be a `ComparePoint` object
     */
    constructor() {
      let comparePoint = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      let compound = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      let penetrate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      super(comparePoint);
      this[compoundSymbol] = !!compound;
      this[penetrateSymbol] = !!penetrate;
    }

    /**
     * Whether the modifier should compound the results or not.
     *
     * @returns {boolean} `true` if it should compound, `false` otherwise
     */
    get compound() {
      return this[compoundSymbol];
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'explode'
     */
    get name() {
      return 'explode';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `!${this.compound ? '!' : ''}${this.penetrate ? 'p' : ''}${super.notation}`;
    }

    /**
     * Whether the modifier should penetrate the results or not.
     *
     * @returns {boolean} `true` if it should penetrate, `false` otherwise
     */
    get penetrate() {
      return this[penetrateSymbol];
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {array}
     */
    defaultComparePoint(_context) {
      return ['=', _context.max];
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      super.run(results, _context);

      // ensure that the dice can explode without going into an infinite loop
      if (_context.min === _context.max) {
        throw new DieActionValueError(_context, 'explode');
      }
      const parsedResults = results;
      parsedResults.rolls = results.rolls.map(roll => {
        const subRolls = [roll];
        let compareValue = roll.value;

        // explode if the value matches the compare point, and we haven't reached the max iterations
        for (let i = 0; i < this.maxIterations && this.isComparePoint(compareValue); i++) {
          const prevRoll = subRolls[subRolls.length - 1];
          // roll the dice
          const rollResult = _context.rollOnce();

          // update the value to check against
          compareValue = rollResult.value;

          // add the explode modifier flag
          prevRoll.modifiers.add('explode');

          // add the penetrate modifier flag and decrement the value
          if (this.penetrate) {
            prevRoll.modifiers.add('penetrate');
            rollResult.value -= 1;
          }

          // add the rolls to the list
          subRolls.push(rollResult);
        }

        // return the rolls (Compounded if necessary)
        /* eslint-disable  no-param-reassign */
        if (this.compound && subRolls.length > 1) {
          // update the roll value and modifiers
          roll.value = sumArray(subRolls.map(result => result.value));
          roll.modifiers = ['explode', 'compound'];
          if (this.penetrate) {
            roll.modifiers.add('penetrate');
          }
          return roll;
        }
        /* eslint-enable */

        return subRolls;
      }).flat();
      return parsedResults;
    }

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
    toJSON() {
      const {
        compound,
        penetrate
      } = this;
      return Object.assign(super.toJSON(), {
        compound,
        penetrate
      });
    }
  }

  const maxSymbol = Symbol('max');

  /**
   * A `MaxModifier` causes die rolls over a maximum value to be treated as the maximum value.
   *
   * @since 4.3.0
   *
   * @see {@link MinModifier} for the opposite of this modifier
   *
   * @extends {Modifier}
   */
  class MaxModifier extends Modifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 2;

    /**
     * Create a `MaxModifier` instance.
     *
     * @param {number} max The maximum value
     *
     * @throws {TypeError} max must be a number
     */
    constructor(max) {
      super();
      this.max = max;
    }

    /**
     * The maximum value.
     *
     * @returns {Number}
     */
    get max() {
      return this[maxSymbol];
    }

    /**
     * Set the maximum value.
     *
     * @param {number} value
     *
     * @throws {TypeError} max must be a number
     */
    set max(value) {
      if (!isNumeric(value)) {
        throw new TypeError('max must be a number');
      }
      this[maxSymbol] = parseFloat(`${value}`);
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'max'
     */
    get name() {
      return 'max';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `max${this.max}`;
    }

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      const parsedResults = results;
      parsedResults.rolls = results.rolls.map(roll => {
        const parsedRoll = roll;
        if (roll.value > this.max) {
          parsedRoll.value = this.max;
          parsedRoll.modifiers.add('max');
        }
        return parsedRoll;
      });
      return parsedResults;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string, max: Number}}
     */
    toJSON() {
      const {
        max
      } = this;
      return Object.assign(super.toJSON(), {
        max
      });
    }
  }

  const minSymbol = Symbol('min');

  /**
   * A `MinModifier` causes die rolls under a minimum value to be treated as the minimum value.
   *
   * @since 4.3.0
   *
   * @see {@link MaxModifier} for the opposite of this modifier
   *
   * @extends {Modifier}
   */
  class MinModifier extends Modifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 1;

    /**
     * Create a `MinModifier` instance.
     *
     * @param {number} min The minimum value
     *
     * @throws {TypeError} min must be a number
     */
    constructor(min) {
      super();
      this.min = min;
    }

    /**
     * The minimum value.
     *
     * @returns {Number}
     */
    get min() {
      return this[minSymbol];
    }

    /**
     * Set the minimum value.
     *
     * @param {number} value
     *
     * @throws {TypeError} min must be a number
     */
    set min(value) {
      if (!isNumeric(value)) {
        throw new TypeError('min must be a number');
      }
      this[minSymbol] = parseFloat(`${value}`);
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'min'
     */
    get name() {
      return 'min';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `min${this.min}`;
    }

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      const parsedResults = results;
      parsedResults.rolls = results.rolls.map(roll => {
        const parsedRoll = roll;
        if (roll.value < this.min) {
          parsedRoll.value = this.min;
          parsedRoll.modifiers.add('min');
        }
        return parsedRoll;
      });
      return parsedResults;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string, min: Number}}
     */
    toJSON() {
      const {
        min
      } = this;
      return Object.assign(super.toJSON(), {
        min
      });
    }
  }

  const onceSymbol$1 = Symbol('once');

  /**
   * A `ReRollModifier` re-rolls dice that match a given test, and replaces the new value with the old
   * one.
   *
   * @see {@link ExplodeModifier} if you want to keep the old value as well
   *
   * @extends ComparisonModifier
   */
  class ReRollModifier extends ComparisonModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 4;

    /**
     * Create a `ReRollModifier` instance.
     *
     * @param {boolean} [once=false] Whether to only re-roll once or not
     * @param {ComparePoint} [comparePoint=null] The comparison object
     */
    constructor() {
      let once = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      let comparePoint = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      super(comparePoint);
      this.once = !!once;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 're-roll'
     */
    get name() {
      return 're-roll';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `r${this.once ? 'o' : ''}${super.notation}`;
    }

    /**
     * Whether the modifier should only re-roll once or not.
     *
     * @returns {boolean} `true` if it should re-roll once, `false` otherwise
     */
    get once() {
      return !!this[onceSymbol$1];
    }

    /**
     * Set whether the modifier should only re-roll once or not.
     *
     * @param {boolean} value
     */
    set once(value) {
      this[onceSymbol$1] = !!value;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The default compare point definition
     *
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {array}
     */
    defaultComparePoint(_context) {
      return ['=', _context.min];
    }
    /* eslint-enable class-methods-use-this */

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      super.run(results, _context);

      // ensure that the dice can explode without going into an infinite loop
      if (_context.min === _context.max) {
        throw new DieActionValueError(_context, 're-roll');
      }
      results.rolls.map(roll => {
        // re-roll if the value matches the compare point, and we haven't hit the max iterations,
        // unless we're only rolling once and have already re-rolled
        for (let i = 0; i < this.maxIterations && this.isComparePoint(roll.value); i++) {
          // re-roll the dice
          const rollResult = _context.rollOnce();

          // update the roll value (Unlike exploding, the original value is not kept)
          // eslint-disable-next-line no-param-reassign
          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`re-roll${this.once ? '-once' : ''}`);

          // stop the loop if we're only re-rolling once
          if (this.once) {
            break;
          }
        }
        return roll;
      });
      return results;
    }

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
     *  once: boolean
     * }}
     */
    toJSON() {
      const {
        once
      } = this;
      return Object.assign(super.toJSON(), {
        once
      });
    }
  }

  const directionSymbol = Symbol('direction');

  /**
   * A `SortingModifier` sorts roll results by their value, either ascending or descending.
   *
   * @extends ComparisonModifier
   */
  class SortingModifier extends Modifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 11;

    /**
     * Create a `SortingModifier` instance.
     *
     * @param {string} [direction=a] The direction to sort in; 'a' (Ascending) or 'd' (Descending)
     *
     * @throws {RangeError} Direction must be 'a' or 'd'
     */
    constructor() {
      let direction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'a';
      super();
      this.direction = direction;
    }

    /**
     * The sort direction.
     *
     * @returns {string} Either 'a' or 'd'
     */
    get direction() {
      return this[directionSymbol];
    }

    /**
     * Set the sort direction.
     *
     * @param {string} value Either 'a' (Ascending) or 'd' (Descending)
     *
     * @throws {RangeError} Direction must be 'a' or 'd'
     */
    set direction(value) {
      if (value !== 'a' && value !== 'd') {
        throw new RangeError('Direction must be "a" (Ascending) or "d" (Descending)');
      }
      this[directionSymbol] = value;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'sorting'
     */
    get name() {
      return 'sorting';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `s${this.direction}`;
    }

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      let resultsKey;
      if (results instanceof ResultGroup) {
        resultsKey = 'results';
      } else {
        resultsKey = 'rolls';
      }

      /* eslint-disable no-param-reassign */
      results[resultsKey] = results[resultsKey].sort((a, b) => {
        if (this.direction === 'd') {
          return b.value - a.value;
        }
        return a.value - b.value;
      });

      // if result group, we also need to sort any die rolls in th sub-rolls
      if (results instanceof ResultGroup) {
        results[resultsKey] = results[resultsKey].map(subRoll => {
          if (subRoll instanceof ResultGroup || subRoll instanceof RollResults) {
            return this.run(subRoll, _context);
          }
          return subRoll;
        });
      }
      /* eslint-enable */

      return results;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{notation: string, name: string, type: string, direction: string}}
     */
    toJSON() {
      const {
        direction
      } = this;
      return Object.assign(super.toJSON(), {
        direction
      });
    }
  }

  const failureCPSymbol = Symbol('failure-cp');

  /**
   * A `TargetModifier` determines whether rolls are classed as a success, failure, or neutral.
   *
   * This modifies the roll values, depending on the state;
   *
   * success = `1`, failure = `-1`, neutral = `0`.
   *
   * @extends ComparisonModifier
   */
  class TargetModifier extends ComparisonModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 8;

    /**
     * Create a `TargetModifier` instance.
     *
     * @param {ComparePoint} successCP The success comparison object
     * @param {ComparePoint} [failureCP=null] The failure comparison object
     *
     * @throws {TypeError} failure comparePoint must be instance of ComparePoint or null
     */
    constructor(successCP) {
      let failureCP = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      super(successCP);

      // set the failure compare point
      this.failureComparePoint = failureCP;
    }

    /**
     * The failure compare point for the modifier
     *
     * @returns {ComparePoint|null}
     */
    get failureComparePoint() {
      return this[failureCPSymbol];
    }

    /**
     * Set the failure compare point
     *
     * @param {ComparePoint|null} comparePoint
     *
     * @throws {TypeError} failure comparePoint must be instance of ComparePoint or null
     */
    set failureComparePoint(comparePoint) {
      if (comparePoint && !(comparePoint instanceof ComparePoint)) {
        throw new TypeError('failure comparePoint must be instance of ComparePoint or null');
      }
      this[failureCPSymbol] = comparePoint || null;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'target'
     */
    get name() {
      return 'target';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `${super.notation}${this.failureComparePoint ? `f${this.failureComparePoint}` : ''}`;
    }

    /**
     * The success compare point for the modifier
     *
     * @returns {ComparePoint}
     */
    get successComparePoint() {
      return this.comparePoint;
    }

    /**
     * Set the success compare point for the modifier
     *
     * @param {ComparePoint} value
     */
    set successComparePoint(value) {
      super.comparePoint = value;
    }

    /**
     * Check if the value is a success/failure/neither and return the corresponding state value.
     *
     * @param {number} value The number to compare against
     *
     * @returns {number} success = `1`, failure = `-1`, neutral = `0`
     */
    getStateValue(value) {
      if (this.isSuccess(value)) {
        return 1;
      }
      if (this.isFailure(value)) {
        return -1;
      }
      return 0;
    }

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
    isFailure(value) {
      return this.failureComparePoint ? this.failureComparePoint.isMatch(value) : false;
    }

    /**
     * Check if the `value` is neither a success nor a failure.
     *
     * @param {number} value The number to compare against
     *
     * @returns {boolean} `true` if the value doesn't match the success and failure compare points
     */
    isNeutral(value) {
      return !this.isSuccess(value) && !this.isFailure(value);
    }

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
    isSuccess(value) {
      return this.isComparePoint(value);
    }

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      let rolls;
      if (results instanceof ResultGroup) {
        rolls = results.results;
      } else {
        rolls = results.rolls;
      }

      // loop through each roll and see if it matches the target
      rolls.forEach(roll => {
        // add the modifier flag
        if (this.isSuccess(roll.value)) {
          roll.modifiers.add('target-success');
        } else if (this.isFailure(roll.value)) {
          roll.modifiers.add('target-failure');
        }

        // set the value to the success state value
        // eslint-disable-next-line no-param-reassign
        roll.calculationValue = this.getStateValue(roll.value);
      });
      return results;
    }

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
    toJSON() {
      const {
        failureComparePoint,
        successComparePoint
      } = this;

      // get the inherited object, but remove the comparePoint property
      const result = super.toJSON();
      delete result.comparePoint;
      return Object.assign(result, {
        failureComparePoint,
        successComparePoint
      });
    }
  }

  const onceSymbol = Symbol('once');
  const isDuplicate = function (value, index, collection) {
    let notFirst = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const i = collection.map(e => e.value).indexOf(value.value);
    return notFirst ? i < index : i !== index;
  };

  /**
   * A `UniqueModifier` re-rolls any non-unique dice values and, optionally that match a given test.
   *
   * @extends ComparisonModifier
   */
  class UniqueModifier extends ComparisonModifier {
    /**
     * The default modifier execution order.
     *
     * @type {number}
     */
    static order = 5;

    /**
     * Create a `UniqueModifier` instance.
     *
     * @param {boolean} [once=false] Whether to only re-roll once or not
     * @param {ComparePoint} [comparePoint=null] The comparison object
     */
    constructor() {
      let once = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      let comparePoint = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      super(comparePoint);
      this.once = !!once;
    }

    /* eslint-disable class-methods-use-this */
    /**
     * The name of the modifier.
     *
     * @returns {string} 'unique'
     */
    get name() {
      return 'unique';
    }
    /* eslint-enable class-methods-use-this */

    /**
     * The modifier's notation.
     *
     * @returns {string}
     */
    get notation() {
      return `u${this.once ? 'o' : ''}${super.notation}`;
    }

    /**
     * Whether the modifier should only re-roll once or not.
     *
     * @returns {boolean} `true` if it should re-roll once, `false` otherwise
     */
    get once() {
      return !!this[onceSymbol];
    }

    /**
     * Set whether the modifier should only re-roll once or not.
     *
     * @param {boolean} value
     */
    set once(value) {
      this[onceSymbol] = !!value;
    }

    /**
     * Run the modifier on the results.
     *
     * @param {RollResults} results The results to run the modifier against
     * @param {StandardDice|RollGroup} _context The object that the modifier is attached to
     *
     * @returns {RollResults} The modified results
     */
    run(results, _context) {
      // ensure that the dice can re-roll without going into an infinite loop
      if (_context.min === _context.max) {
        throw new DieActionValueError(_context, 're-roll');
      }
      results.rolls.forEach((roll, index, collection) => {
        // no need to re-roll on the first roll
        if (index === 0) {
          return;
        }
        for (let i = 0; i < this.maxIterations && (!this.comparePoint || this.isComparePoint(roll.value)) && isDuplicate(roll, index, collection, true); i++) {
          // re-roll the dice
          const rollResult = _context.rollOnce();

          // eslint-disable-next-line no-param-reassign
          roll.value = rollResult.value;

          // add the re-roll modifier flag
          roll.modifiers.add(`unique${this.once ? '-once' : ''}`);
          if (this.once) {
            break;
          }
        }
      });
      return results;
    }

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
     *  once: boolean
     * }}
     */
    toJSON() {
      const {
        once
      } = this;
      return Object.assign(super.toJSON(), {
        once
      });
    }
  }

  var index$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ComparisonModifier: ComparisonModifier,
    CriticalFailureModifier: CriticalFailureModifier,
    CriticalSuccessModifier: CriticalSuccessModifier,
    DropModifier: DropModifier,
    ExplodeModifier: ExplodeModifier,
    KeepModifier: KeepModifier,
    MaxModifier: MaxModifier,
    MinModifier: MinModifier,
    Modifier: Modifier,
    ReRollModifier: ReRollModifier,
    SortingModifier: SortingModifier,
    TargetModifier: TargetModifier,
    UniqueModifier: UniqueModifier
  });

  var index = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ResultGroup: ResultGroup,
    RollResult: RollResult,
    RollResults: RollResults
  });

  /**
   * Check if the value is a valid base64 encoded string.
   *
   * @param {string} val
   *
   * @returns {boolean} `true` if it is valid base64 encoded, `false` otherwise
   */
  const isBase64 = val => {
    try {
      return !!(val && btoa(atob(val)) === val);
    } catch (e) {
      return false;
    }
  };

  /**
   * Check if the value is a valid JSON encoded string.
   *
   * @param {string} val
   *
   * @returns {boolean} `true` if the value is valid JSON, `false` otherwise
   */
  const isJson = val => {
    try {
      const parsed = val ? JSON.parse(val) : false;
      return !!(parsed && typeof parsed === 'object');
    } catch (e) {
      return false;
    }
  };

  const expressionsSymbol$1 = Symbol('expressions');
  const modifiersSymbol = Symbol('modifiers');

  /**
   * A `RollGroup` is a group of one or more "sub-rolls".
   *
   * A sub-roll is just simple roll notation (e.g. `4d6`, `2d10*3`, `5/10d20`)
   *
   * @example <caption>`{4d6+4, 2d%/5}k1`</caption>
   * const expressions = [
   *   [
   *     new StandardDice(6, 4),
   *     '+',
   *     4,
   *   ],
   *   [
   *     new PercentileDice(2),
   *     '/',
   *     5,
   *   ],
   * ];
   *
   * const modifiers = [
   *   new KeepModifier(),
   * ];
   *
   * const group = new RollGroup(expressions, modifiers);
   *
   * @since 4.5.0
   */
  class RollGroup extends HasDescription {
    /**
     * Create a `RollGroup` instance.
     *
     * @param {Array.<Array.<StandardDice|string|number>>} [expressions=[]] List of sub-rolls
     * @param {Map<string, Modifier>|Modifier[]|{}|null} [modifiers=[]] The modifiers that affect the
     * group
     * @param {Description|string|null} [description=null] The roll description.
     */
    constructor() {
      let expressions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      let modifiers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      let description = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
      super(description);
      this.expressions = expressions;
      this.modifiers = modifiers;
    }

    /**
     * The sub-roll expressions in the group.
     *
     * @returns {Array.<Array.<StandardDice|string|number>>}
     */
    get expressions() {
      return [...(this[expressionsSymbol$1] || [])];
    }

    /**
     * Set the sub-roll expressions in the group.
     *
     * @param {Array.<Array.<StandardDice|string|number>>} expressions
     *
     * @throws {TypeError} Expressions must be an array of arrays
     * @throws {TypeError} Sub expressions cannot be empty
     * @throws {TypeError} Sub expression items must be Dice, numbers, or strings
     */
    set expressions(expressions) {
      if (!expressions) {
        throw new RequiredArgumentError('expressions');
      }
      if (!Array.isArray(expressions)) {
        throw new TypeError(`expressions must be an array: ${expressions}`);
      }

      // loop through each expression and add it to the list
      this[expressionsSymbol$1] = [];
      expressions.forEach(expression => {
        if (!expression || !Array.isArray(expression)) {
          throw new TypeError(`Expressions must be an array of arrays: ${expressions}`);
        }
        if (expression.length === 0) {
          throw new TypeError(`Sub expressions cannot be empty: ${expressions}`);
        }
        if (!expression.every(value => value instanceof StandardDice || typeof value === 'string' || typeof value === 'number')) {
          throw new TypeError('Sub expression items must be Dice, numbers, or strings');
        }
        this[expressionsSymbol$1].push(expression);
      });
    }

    /**
     * The modifiers that affect the object.
     *
     * @returns {Map<string, Modifier>|null}
     */
    get modifiers() {
      if (this[modifiersSymbol]) {
        // ensure modifiers are ordered correctly
        return new Map([...this[modifiersSymbol]].sort((a, b) => a[1].order - b[1].order));
      }
      return null;
    }

    /**
     * Set the modifiers that affect this group.
     *
     * @param {Map<string, Modifier>|Modifier[]|{}|null} value
     *
     * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
     */
    set modifiers(value) {
      let modifiers;
      if (value instanceof Map) {
        modifiers = value;
      } else if (Array.isArray(value)) {
        // loop through and get the modifier name of each item and use it as the map key
        modifiers = new Map(value.map(modifier => [modifier.name, modifier]));
      } else if (typeof value === 'object') {
        modifiers = new Map(Object.entries(value));
      } else {
        throw new TypeError('modifiers should be a Map, array, or an Object containing Modifiers');
      }
      if (modifiers.size && [...modifiers.entries()].some(entry => !(entry[1] instanceof Modifier))) {
        throw new TypeError('modifiers must only contain Modifier instances');
      }
      this[modifiersSymbol] = modifiers;
    }

    /**
     * The group notation. e.g. `{4d6, 2d10+3}k1`.
     *
     * @returns {string}
     */
    get notation() {
      let notation = this.expressions.map(expression => expression.reduce((acc, e) => acc + e, '')).join(', ');
      notation = `{${notation}}`;
      if (this.modifiers && this.modifiers.size) {
        notation += [...this.modifiers.values()].reduce((acc, modifier) => acc + modifier.notation, '');
      }
      return notation;
    }

    /**
     * Run the sub-roll expressions for the group.
     *
     * @example <caption>`{4d6+4/1d6, 2d10/3}k1`</caption>
     * ResultGroup {
     *   results: [
     *     // sub-roll 1 - 4d6+4/1d6
     *     ResultGroup {
     *       results: [
     *         RollResults {
     *           rolls: [
     *             RollResult {
     *               value: 2
     *             },
     *             RollResult {
     *               value: 5
     *             },
     *             RollResult {
     *               value: 4
     *             },
     *             RollResult {
     *               value: 1
     *             }
     *           ]
     *         },
     *         '+',
     *         4,
     *         '/',
     *         RollResults {
     *           rolls: [
     *             RollResult {
     *               value: 4
     *             }
     *           ]
     *         }
     *       ]
     *     },
     *     // sub-roll 2 - 2d10/3
     *     ResultGroup {
     *       results: [
     *         RollResults {
     *           rolls: [
     *             RollResults {
     *               4
     *             },
     *             RollResults {
     *               9
     *             }
     *           ]
     *         },
     *         '/',
     *         3
     *       ]
     *     }
     *   ]
     * }
     *
     * @returns {ResultGroup} The results of the sub-rolls
     */
    roll() {
      // loop through each sub-roll expression and roll it
      // adding the results to a single RollResults object
      const rollResults = new ResultGroup(this.expressions.map(subRoll => {
        const result = subRoll.map(expression => {
          if (expression instanceof StandardDice) {
            // roll the object and return the value
            return expression.roll();
          }
          return expression;
        });
        return new ResultGroup(result);
      }));

      // flag it as roll group results
      rollResults.isRollGroup = true;

      // loop through each modifier and carry out its actions
      (this.modifiers || []).forEach(modifier => {
        modifier.run(rollResults, this);
      });
      return rollResults;
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{
     *  notation: string,
     *  modifiers: (Map<string, Modifier>|null),
     *  type: string,
     *  expressions: Array.<Array.<StandardDice|string|number>>
     * }}
     */
    toJSON() {
      const {
        modifiers,
        notation,
        expressions
      } = this;
      return Object.assign(super.toJSON(), {
        expressions,
        modifiers,
        notation,
        type: 'group'
      });
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @see {@link RollGroup#notation}
     *
     * @returns {string}
     */
    toString() {
      return `${this.notation}${this.description ? ` ${this.description}` : ''}`;
    }
  }

  // Generated by Peggy 3.0.2.
  function peg$subclass(child, parent) {
    function C() {
      this.constructor = child;
    }
    C.prototype = parent.prototype;
    child.prototype = new C();
  }
  function peg$SyntaxError(message, expected, found, location) {
    var self = Error.call(this, message);
    // istanbul ignore next Check is a necessary evil to support older environments
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(self, peg$SyntaxError.prototype);
    }
    self.expected = expected;
    self.found = found;
    self.location = location;
    self.name = "SyntaxError";
    return self;
  }
  peg$subclass(peg$SyntaxError, Error);
  function peg$padEnd(str, targetLength, padString) {
    padString = padString || " ";
    if (str.length > targetLength) {
      return str;
    }
    targetLength -= str.length;
    padString += padString.repeat(targetLength);
    return str + padString.slice(0, targetLength);
  }
  peg$SyntaxError.prototype.format = function (sources) {
    var str = "Error: " + this.message;
    if (this.location) {
      var src = null;
      var k;
      for (k = 0; k < sources.length; k++) {
        if (sources[k].source === this.location.source) {
          src = sources[k].text.split(/\r\n|\n|\r/g);
          break;
        }
      }
      var s = this.location.start;
      var offset_s = this.location.source && typeof this.location.source.offset === "function" ? this.location.source.offset(s) : s;
      var loc = this.location.source + ":" + offset_s.line + ":" + offset_s.column;
      if (src) {
        var e = this.location.end;
        var filler = peg$padEnd("", offset_s.line.toString().length, ' ');
        var line = src[s.line - 1];
        var last = s.line === e.line ? e.column : line.length + 1;
        var hatLen = last - s.column || 1;
        str += "\n --> " + loc + "\n" + filler + " |\n" + offset_s.line + " | " + line + "\n" + filler + " | " + peg$padEnd("", s.column - 1, ' ') + peg$padEnd("", hatLen, "^");
      } else {
        str += "\n at " + loc;
      }
    }
    return str;
  };
  peg$SyntaxError.buildMessage = function (expected, found) {
    var DESCRIBE_EXPECTATION_FNS = {
      literal: function (expectation) {
        return "\"" + literalEscape(expectation.text) + "\"";
      },
      class: function (expectation) {
        var escapedParts = expectation.parts.map(function (part) {
          return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
        });
        return "[" + (expectation.inverted ? "^" : "") + escapedParts.join("") + "]";
      },
      any: function () {
        return "any character";
      },
      end: function () {
        return "end of input";
      },
      other: function (expectation) {
        return expectation.description;
      }
    };
    function hex(ch) {
      return ch.charCodeAt(0).toString(16).toUpperCase();
    }
    function literalEscape(s) {
      return s.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function (ch) {
        return "\\x0" + hex(ch);
      }).replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
        return "\\x" + hex(ch);
      });
    }
    function classEscape(s) {
      return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function (ch) {
        return "\\x0" + hex(ch);
      }).replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) {
        return "\\x" + hex(ch);
      });
    }
    function describeExpectation(expectation) {
      return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected) {
      var descriptions = expected.map(describeExpectation);
      var i, j;
      descriptions.sort();
      if (descriptions.length > 0) {
        for (i = 1, j = 1; i < descriptions.length; i++) {
          if (descriptions[i - 1] !== descriptions[i]) {
            descriptions[j] = descriptions[i];
            j++;
          }
        }
        descriptions.length = j;
      }
      switch (descriptions.length) {
        case 1:
          return descriptions[0];
        case 2:
          return descriptions[0] + " or " + descriptions[1];
        default:
          return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
      }
    }
    function describeFound(found) {
      return found ? "\"" + literalEscape(found) + "\"" : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
  };
  function peg$parse(input, options) {
    options = options !== undefined ? options : {};
    var peg$FAILED = {};
    var peg$source = options.grammarSource;
    var peg$startRuleFunctions = {
      Main: peg$parseMain
    };
    var peg$startRuleFunction = peg$parseMain;
    var peg$c0 = "{";
    var peg$c1 = ",";
    var peg$c2 = "}";
    var peg$c3 = "d";
    var peg$c4 = "d%";
    var peg$c5 = "dF";
    var peg$c6 = ".";
    var peg$c7 = "!";
    var peg$c8 = "p";
    var peg$c9 = "k";
    var peg$c10 = "max";
    var peg$c11 = "min";
    var peg$c12 = "r";
    var peg$c13 = "o";
    var peg$c14 = "u";
    var peg$c15 = "cs";
    var peg$c16 = "cf";
    var peg$c17 = "s";
    var peg$c18 = "a";
    var peg$c19 = "f";
    var peg$c20 = "!=";
    var peg$c21 = "<=";
    var peg$c22 = ">=";
    var peg$c23 = "=";
    var peg$c24 = "<>";
    var peg$c25 = ">";
    var peg$c26 = "<";
    var peg$c27 = "(";
    var peg$c28 = ")";
    var peg$c29 = "abs";
    var peg$c30 = "ceil";
    var peg$c31 = "cos";
    var peg$c32 = "exp";
    var peg$c33 = "floor";
    var peg$c34 = "log";
    var peg$c35 = "round";
    var peg$c36 = "sign";
    var peg$c37 = "sin";
    var peg$c38 = "sqrt";
    var peg$c39 = "tan";
    var peg$c40 = "pow";
    var peg$c41 = "-";
    var peg$c42 = "**";
    var peg$c43 = "*";
    var peg$c44 = "^";
    var peg$c45 = "%";
    var peg$c46 = "/";
    var peg$c47 = "+";
    var peg$c48 = "/*";
    var peg$c49 = "*/";
    var peg$c50 = "[";
    var peg$c51 = "]";
    var peg$c52 = "//";
    var peg$c53 = "#";
    var peg$r0 = /^[12]/;
    var peg$r1 = /^[lh]/;
    var peg$r2 = /^[.]/;
    var peg$r3 = /^[1-9]/;
    var peg$r4 = /^[0-9]/;
    var peg$r5 = /^[^\]]/;
    var peg$r6 = /^[\n\r\u2028\u2029]/;
    var peg$r7 = /^[ \t\n\r]/;
    var peg$e0 = peg$literalExpectation("{", false);
    var peg$e1 = peg$literalExpectation(",", false);
    var peg$e2 = peg$literalExpectation("}", false);
    var peg$e3 = peg$literalExpectation("d", false);
    var peg$e4 = peg$literalExpectation("d%", false);
    var peg$e5 = peg$literalExpectation("dF", false);
    var peg$e6 = peg$literalExpectation(".", false);
    var peg$e7 = peg$classExpectation(["1", "2"], false, false);
    var peg$e8 = peg$literalExpectation("!", false);
    var peg$e9 = peg$literalExpectation("p", false);
    var peg$e10 = peg$classExpectation(["l", "h"], false, false);
    var peg$e11 = peg$literalExpectation("k", false);
    var peg$e12 = peg$literalExpectation("max", false);
    var peg$e13 = peg$literalExpectation("min", false);
    var peg$e14 = peg$literalExpectation("r", false);
    var peg$e15 = peg$literalExpectation("o", false);
    var peg$e16 = peg$literalExpectation("u", false);
    var peg$e17 = peg$literalExpectation("cs", false);
    var peg$e18 = peg$literalExpectation("cf", false);
    var peg$e19 = peg$literalExpectation("s", false);
    var peg$e20 = peg$literalExpectation("a", false);
    var peg$e21 = peg$literalExpectation("f", false);
    var peg$e22 = peg$literalExpectation("!=", false);
    var peg$e23 = peg$literalExpectation("<=", false);
    var peg$e24 = peg$literalExpectation(">=", false);
    var peg$e25 = peg$literalExpectation("=", false);
    var peg$e26 = peg$literalExpectation("<>", false);
    var peg$e27 = peg$literalExpectation(">", false);
    var peg$e28 = peg$literalExpectation("<", false);
    var peg$e29 = peg$literalExpectation("(", false);
    var peg$e30 = peg$literalExpectation(")", false);
    var peg$e31 = peg$literalExpectation("abs", false);
    var peg$e32 = peg$literalExpectation("ceil", false);
    var peg$e33 = peg$literalExpectation("cos", false);
    var peg$e34 = peg$literalExpectation("exp", false);
    var peg$e35 = peg$literalExpectation("floor", false);
    var peg$e36 = peg$literalExpectation("log", false);
    var peg$e37 = peg$literalExpectation("round", false);
    var peg$e38 = peg$literalExpectation("sign", false);
    var peg$e39 = peg$literalExpectation("sin", false);
    var peg$e40 = peg$literalExpectation("sqrt", false);
    var peg$e41 = peg$literalExpectation("tan", false);
    var peg$e42 = peg$literalExpectation("pow", false);
    var peg$e43 = peg$literalExpectation("-", false);
    var peg$e44 = peg$classExpectation(["."], false, false);
    var peg$e45 = peg$classExpectation([["1", "9"]], false, false);
    var peg$e46 = peg$classExpectation([["0", "9"]], false, false);
    var peg$e47 = peg$literalExpectation("**", false);
    var peg$e48 = peg$literalExpectation("*", false);
    var peg$e49 = peg$literalExpectation("^", false);
    var peg$e50 = peg$literalExpectation("%", false);
    var peg$e51 = peg$literalExpectation("/", false);
    var peg$e52 = peg$literalExpectation("+", false);
    var peg$e53 = peg$otherExpectation("comment");
    var peg$e54 = peg$literalExpectation("/*", false);
    var peg$e55 = peg$literalExpectation("*/", false);
    var peg$e56 = peg$anyExpectation();
    var peg$e57 = peg$literalExpectation("[", false);
    var peg$e58 = peg$classExpectation(["]"], true, false);
    var peg$e59 = peg$literalExpectation("]", false);
    var peg$e60 = peg$literalExpectation("//", false);
    var peg$e61 = peg$literalExpectation("#", false);
    var peg$e62 = peg$classExpectation(["\n", "\r", "\u2028", "\u2029"], false, false);
    var peg$e63 = peg$otherExpectation("whitespace");
    var peg$e64 = peg$classExpectation([" ", "\t", "\n", "\r"], false, false);
    var peg$e65 = peg$otherExpectation("whitespace or comment");
    var peg$f0 = function (expr, exprs, modifiers, descriptions) {
      return new RollGroup([expr, ...exprs.map(v => v[3])], Object.assign({}, ...modifiers.map(item => {
        return {
          [item.name]: item
        };
      })), descriptions.find(o => o instanceof Description));
    };
    var peg$f1 = function (die, modifiers, descriptions) {
      die.modifiers = Object.assign({}, ...modifiers.map(item => {
        return {
          [item.name]: item
        };
      }));
      die.description = descriptions.find(o => o instanceof Description);
      return die;
    };
    var peg$f2 = function (qty, sides) {
      return new StandardDice(sides, qty || 1);
    };
    var peg$f3 = function (qty) {
      return new PercentileDice(qty || 1);
    };
    var peg$f4 = function (qty, sides) {
      return new FudgeDice(sides ? parseInt(sides[1], 10) : 2, qty || 1);
    };
    var peg$f5 = function (compound, penetrate, comparePoint) {
      return new ExplodeModifier(comparePoint, !!compound, !!penetrate);
    };
    var peg$f6 = function (successCP, failureCP) {
      return new TargetModifier(successCP, failureCP);
    };
    var peg$f7 = function (end, qty) {
      return new DropModifier(end || 'l', qty);
    };
    var peg$f8 = function (end, qty) {
      return new KeepModifier(end || 'h', qty);
    };
    var peg$f9 = function (max) {
      return new MaxModifier(max);
    };
    var peg$f10 = function (min) {
      return new MinModifier(min);
    };
    var peg$f11 = function (once, comparePoint) {
      return new ReRollModifier(!!once, comparePoint);
    };
    var peg$f12 = function (once, comparePoint) {
      return new UniqueModifier(!!once, comparePoint);
    };
    var peg$f13 = function (comparePoint) {
      return new CriticalSuccessModifier(comparePoint);
    };
    var peg$f14 = function (comparePoint) {
      return new CriticalFailureModifier(comparePoint);
    };
    var peg$f15 = function (dir) {
      return new SortingModifier(dir || 'a');
    };
    var peg$f16 = function (comparePoint) {
      return comparePoint;
    };
    var peg$f17 = function (operator, value) {
      return new ComparePoint(operator, value);
    };
    var peg$f18 = function (l, expr, r) {
      return evaluate(text());
    };
    var peg$f19 = function (head, tail) {
      head = Array.isArray(head) ? head : [head];
      return [...head, ...tail.map(_ref => {
        let [, value,, factor] = _ref;
        return [value, factor];
      }).flat(2)];
    };
    var peg$f20 = function (l, expr, r) {
      return [l, ...expr, r];
    };
    var peg$f21 = function (func, expr) {
      return [`${func}(`, ...expr, ')'];
    };
    var peg$f22 = function (func, expr1, expr2) {
      return [`${func}(`, ...expr1, ',', ...expr2, ')'];
    };
    var peg$f23 = function () {
      return parseFloat(text());
    };
    var peg$f24 = function () {
      return parseInt(text(), 10);
    };
    var peg$f25 = function () {
      return parseInt(text(), 10);
    };
    var peg$f26 = function () {
      return "^";
    };
    var peg$f27 = function (text) {
      return new Description(text.flat().join(''), Description.types.MULTILINE);
    };
    var peg$f28 = function (text) {
      return new Description(text.flat().join(''), Description.types.MULTILINE);
    };
    var peg$f29 = function (text) {
      return new Description(text.flat().join(''), Description.types.INLINE);
    };
    var peg$currPos = 0;
    var peg$savedPos = 0;
    var peg$posDetailsCache = [{
      line: 1,
      column: 1
    }];
    var peg$maxFailPos = 0;
    var peg$maxFailExpected = [];
    var peg$silentFails = 0;
    var peg$result;
    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }
      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function text() {
      return input.substring(peg$savedPos, peg$currPos);
    }
    function peg$literalExpectation(text, ignoreCase) {
      return {
        type: "literal",
        text: text,
        ignoreCase: ignoreCase
      };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
      return {
        type: "class",
        parts: parts,
        inverted: inverted,
        ignoreCase: ignoreCase
      };
    }
    function peg$anyExpectation() {
      return {
        type: "any"
      };
    }
    function peg$endExpectation() {
      return {
        type: "end"
      };
    }
    function peg$otherExpectation(description) {
      return {
        type: "other",
        description: description
      };
    }
    function peg$computePosDetails(pos) {
      var details = peg$posDetailsCache[pos];
      var p;
      if (details) {
        return details;
      } else {
        p = pos - 1;
        while (!peg$posDetailsCache[p]) {
          p--;
        }
        details = peg$posDetailsCache[p];
        details = {
          line: details.line,
          column: details.column
        };
        while (p < pos) {
          if (input.charCodeAt(p) === 10) {
            details.line++;
            details.column = 1;
          } else {
            details.column++;
          }
          p++;
        }
        peg$posDetailsCache[pos] = details;
        return details;
      }
    }
    function peg$computeLocation(startPos, endPos, offset) {
      var startPosDetails = peg$computePosDetails(startPos);
      var endPosDetails = peg$computePosDetails(endPos);
      var res = {
        source: peg$source,
        start: {
          offset: startPos,
          line: startPosDetails.line,
          column: startPosDetails.column
        },
        end: {
          offset: endPos,
          line: endPosDetails.line,
          column: endPosDetails.column
        }
      };
      if (offset && peg$source && typeof peg$source.offset === "function") {
        res.start = peg$source.offset(res.start);
        res.end = peg$source.offset(res.end);
      }
      return res;
    }
    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) {
        return;
      }
      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }
      peg$maxFailExpected.push(expected);
    }
    function peg$buildStructuredError(expected, found, location) {
      return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected, found), expected, found, location);
    }
    function peg$parseMain() {
      var s0;
      s0 = peg$parseExpression();
      return s0;
    }
    function peg$parseRollGroup() {
      var s0, s1, s3, s4, s5, s6, s7, s8, s9;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 123) {
        s1 = peg$c0;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e0);
        }
      }
      if (s1 !== peg$FAILED) {
        peg$parse_();
        s3 = peg$parseExpression();
        if (s3 !== peg$FAILED) {
          s4 = [];
          s5 = peg$currPos;
          s6 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 44) {
            s7 = peg$c1;
            peg$currPos++;
          } else {
            s7 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e1);
            }
          }
          if (s7 !== peg$FAILED) {
            s8 = peg$parse_();
            s9 = peg$parseExpression();
            if (s9 !== peg$FAILED) {
              s6 = [s6, s7, s8, s9];
              s5 = s6;
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          } else {
            peg$currPos = s5;
            s5 = peg$FAILED;
          }
          while (s5 !== peg$FAILED) {
            s4.push(s5);
            s5 = peg$currPos;
            s6 = peg$parse_();
            if (input.charCodeAt(peg$currPos) === 44) {
              s7 = peg$c1;
              peg$currPos++;
            } else {
              s7 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e1);
              }
            }
            if (s7 !== peg$FAILED) {
              s8 = peg$parse_();
              s9 = peg$parseExpression();
              if (s9 !== peg$FAILED) {
                s6 = [s6, s7, s8, s9];
                s5 = s6;
              } else {
                peg$currPos = s5;
                s5 = peg$FAILED;
              }
            } else {
              peg$currPos = s5;
              s5 = peg$FAILED;
            }
          }
          s5 = peg$parse_();
          if (input.charCodeAt(peg$currPos) === 125) {
            s6 = peg$c2;
            peg$currPos++;
          } else {
            s6 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e2);
            }
          }
          if (s6 !== peg$FAILED) {
            s7 = [];
            s8 = peg$parseModifier();
            while (s8 !== peg$FAILED) {
              s7.push(s8);
              s8 = peg$parseModifier();
            }
            s8 = peg$parse__();
            peg$savedPos = s0;
            s0 = peg$f0(s3, s4, s7, s8);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseDice() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      s1 = peg$parseStandardDie();
      if (s1 === peg$FAILED) {
        s1 = peg$parsePercentileDie();
        if (s1 === peg$FAILED) {
          s1 = peg$parseFudgeDie();
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parseModifier();
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$parseModifier();
        }
        s3 = peg$parse__();
        peg$savedPos = s0;
        s0 = peg$f1(s1, s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseStandardDie() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      s1 = peg$parseIntegerOrExpression();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (input.charCodeAt(peg$currPos) === 100) {
        s2 = peg$c3;
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e3);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$parseIntegerOrExpression();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f2(s1, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parsePercentileDie() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = peg$parseIntegerOrExpression();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (input.substr(peg$currPos, 2) === peg$c4) {
        s2 = peg$c4;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e4);
        }
      }
      if (s2 !== peg$FAILED) {
        peg$savedPos = s0;
        s0 = peg$f3(s1);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseFudgeDie() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      s1 = peg$parseIntegerOrExpression();
      if (s1 === peg$FAILED) {
        s1 = null;
      }
      if (input.substr(peg$currPos, 2) === peg$c5) {
        s2 = peg$c5;
        peg$currPos += 2;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e5);
        }
      }
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 46) {
          s4 = peg$c6;
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e6);
          }
        }
        if (s4 !== peg$FAILED) {
          if (peg$r0.test(input.charAt(peg$currPos))) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e7);
            }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f4(s1, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseModifier() {
      var s0;
      s0 = peg$parseExplodeModifier();
      if (s0 === peg$FAILED) {
        s0 = peg$parseTargetModifier();
        if (s0 === peg$FAILED) {
          s0 = peg$parseDropModifier();
          if (s0 === peg$FAILED) {
            s0 = peg$parseKeepModifier();
            if (s0 === peg$FAILED) {
              s0 = peg$parseReRollModifier();
              if (s0 === peg$FAILED) {
                s0 = peg$parseUniqueModifier();
                if (s0 === peg$FAILED) {
                  s0 = peg$parseCriticalSuccessModifier();
                  if (s0 === peg$FAILED) {
                    s0 = peg$parseCriticalFailureModifier();
                    if (s0 === peg$FAILED) {
                      s0 = peg$parseSortingModifier();
                      if (s0 === peg$FAILED) {
                        s0 = peg$parseMaxModifier();
                        if (s0 === peg$FAILED) {
                          s0 = peg$parseMinModifier();
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      return s0;
    }
    function peg$parseExplodeModifier() {
      var s0, s1, s2, s3, s4;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 33) {
        s1 = peg$c7;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e8);
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 33) {
          s2 = peg$c7;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e8);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        if (input.charCodeAt(peg$currPos) === 112) {
          s3 = peg$c8;
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e9);
          }
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        s4 = peg$parseComparePoint();
        if (s4 === peg$FAILED) {
          s4 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f5(s2, s3, s4);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseTargetModifier() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = peg$parseComparePoint();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseFailComparePoint();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f6(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseDropModifier() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 100) {
        s1 = peg$c3;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e3);
        }
      }
      if (s1 !== peg$FAILED) {
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e10);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        s3 = peg$parseIntegerNumber();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f7(s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseKeepModifier() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 107) {
        s1 = peg$c9;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e11);
        }
      }
      if (s1 !== peg$FAILED) {
        if (peg$r1.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e10);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        s3 = peg$parseIntegerNumber();
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f8(s2, s3);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseMaxModifier() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c10) {
        s1 = peg$c10;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e12);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseFloatNumber();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f9(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseMinModifier() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c11) {
        s1 = peg$c11;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e13);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseFloatNumber();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f10(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseReRollModifier() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 114) {
        s1 = peg$c12;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e14);
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 111) {
          s2 = peg$c13;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e15);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        s3 = peg$parseComparePoint();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f11(s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseUniqueModifier() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 117) {
        s1 = peg$c14;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e16);
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 111) {
          s2 = peg$c13;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e15);
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        s3 = peg$parseComparePoint();
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f12(s2, s3);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseCriticalSuccessModifier() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c15) {
        s1 = peg$c15;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e17);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseComparePoint();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f13(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseCriticalFailureModifier() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c16) {
        s1 = peg$c16;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e18);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseComparePoint();
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f14(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseSortingModifier() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 115) {
        s1 = peg$c17;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e19);
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 97) {
          s2 = peg$c18;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e20);
          }
        }
        if (s2 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 100) {
            s2 = peg$c3;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e3);
            }
          }
        }
        if (s2 === peg$FAILED) {
          s2 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f15(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseFailComparePoint() {
      var s0, s1, s2;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 102) {
        s1 = peg$c19;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e21);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseComparePoint();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f16(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseComparePoint() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = peg$parseCompareOperator();
      if (s1 !== peg$FAILED) {
        s2 = peg$parseFloatNumber();
        if (s2 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f17(s1, s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseCompareOperator() {
      var s0;
      if (input.substr(peg$currPos, 2) === peg$c20) {
        s0 = peg$c20;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e22);
        }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c21) {
          s0 = peg$c21;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e23);
          }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c22) {
            s0 = peg$c22;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e24);
            }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 61) {
              s0 = peg$c23;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e25);
              }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 2) === peg$c24) {
                s0 = peg$c24;
                peg$currPos += 2;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e26);
                }
              }
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 62) {
                  s0 = peg$c25;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e27);
                  }
                }
                if (s0 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 60) {
                    s0 = peg$c26;
                    peg$currPos++;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e28);
                    }
                  }
                }
              }
            }
          }
        }
      }
      return s0;
    }
    function peg$parseIntegerOrExpression() {
      var s0, s1, s3, s4, s5, s6, s7, s8, s9, s10;
      s0 = peg$parseIntegerNumber();
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
          s1 = peg$c27;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e29);
          }
        }
        if (s1 !== peg$FAILED) {
          peg$parse_();
          s3 = peg$currPos;
          s4 = peg$parseFloatNumber();
          if (s4 !== peg$FAILED) {
            s5 = [];
            s6 = peg$currPos;
            s7 = peg$parse_();
            s8 = peg$parseOperator();
            if (s8 !== peg$FAILED) {
              s9 = peg$parse_();
              s10 = peg$parseFloatNumber();
              if (s10 !== peg$FAILED) {
                s7 = [s7, s8, s9, s10];
                s6 = s7;
              } else {
                peg$currPos = s6;
                s6 = peg$FAILED;
              }
            } else {
              peg$currPos = s6;
              s6 = peg$FAILED;
            }
            if (s6 !== peg$FAILED) {
              while (s6 !== peg$FAILED) {
                s5.push(s6);
                s6 = peg$currPos;
                s7 = peg$parse_();
                s8 = peg$parseOperator();
                if (s8 !== peg$FAILED) {
                  s9 = peg$parse_();
                  s10 = peg$parseFloatNumber();
                  if (s10 !== peg$FAILED) {
                    s7 = [s7, s8, s9, s10];
                    s6 = s7;
                  } else {
                    peg$currPos = s6;
                    s6 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s6;
                  s6 = peg$FAILED;
                }
              }
            } else {
              s5 = peg$FAILED;
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parse_();
            if (input.charCodeAt(peg$currPos) === 41) {
              s5 = peg$c28;
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e30);
              }
            }
            if (s5 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f18();
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      return s0;
    }
    function peg$parseExpression() {
      var s0, s1, s2, s3, s4, s5, s6, s7;
      s0 = peg$currPos;
      s1 = peg$parseFactor();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$parse_();
        s5 = peg$parseOperator();
        if (s5 !== peg$FAILED) {
          s6 = peg$parse_();
          s7 = peg$parseFactor();
          if (s7 !== peg$FAILED) {
            s4 = [s4, s5, s6, s7];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$parse_();
          s5 = peg$parseOperator();
          if (s5 !== peg$FAILED) {
            s6 = peg$parse_();
            s7 = peg$parseFactor();
            if (s7 !== peg$FAILED) {
              s4 = [s4, s5, s6, s7];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        peg$savedPos = s0;
        s0 = peg$f19(s1, s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseFactor() {
      var s0, s1, s3, s5;
      s0 = peg$parseMathFunction();
      if (s0 === peg$FAILED) {
        s0 = peg$parseDice();
        if (s0 === peg$FAILED) {
          s0 = peg$parseFloatNumber();
          if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 40) {
              s1 = peg$c27;
              peg$currPos++;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e29);
              }
            }
            if (s1 !== peg$FAILED) {
              peg$parse_();
              s3 = peg$parseExpression();
              if (s3 !== peg$FAILED) {
                peg$parse_();
                if (input.charCodeAt(peg$currPos) === 41) {
                  s5 = peg$c28;
                  peg$currPos++;
                } else {
                  s5 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e30);
                  }
                }
                if (s5 !== peg$FAILED) {
                  peg$savedPos = s0;
                  s0 = peg$f20(s1, s3, s5);
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
              s0 = peg$parseRollGroup();
            }
          }
        }
      }
      return s0;
    }
    function peg$parseMathFunction() {
      var s0, s1, s2, s4, s6, s8, s10;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 3) === peg$c29) {
        s1 = peg$c29;
        peg$currPos += 3;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e31);
        }
      }
      if (s1 === peg$FAILED) {
        if (input.substr(peg$currPos, 4) === peg$c30) {
          s1 = peg$c30;
          peg$currPos += 4;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e32);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c31) {
            s1 = peg$c31;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e33);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c32) {
              s1 = peg$c32;
              peg$currPos += 3;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e34);
              }
            }
            if (s1 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c33) {
                s1 = peg$c33;
                peg$currPos += 5;
              } else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e35);
                }
              }
              if (s1 === peg$FAILED) {
                if (input.substr(peg$currPos, 3) === peg$c34) {
                  s1 = peg$c34;
                  peg$currPos += 3;
                } else {
                  s1 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e36);
                  }
                }
                if (s1 === peg$FAILED) {
                  if (input.substr(peg$currPos, 5) === peg$c35) {
                    s1 = peg$c35;
                    peg$currPos += 5;
                  } else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e37);
                    }
                  }
                  if (s1 === peg$FAILED) {
                    if (input.substr(peg$currPos, 4) === peg$c36) {
                      s1 = peg$c36;
                      peg$currPos += 4;
                    } else {
                      s1 = peg$FAILED;
                      if (peg$silentFails === 0) {
                        peg$fail(peg$e38);
                      }
                    }
                    if (s1 === peg$FAILED) {
                      if (input.substr(peg$currPos, 3) === peg$c37) {
                        s1 = peg$c37;
                        peg$currPos += 3;
                      } else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) {
                          peg$fail(peg$e39);
                        }
                      }
                      if (s1 === peg$FAILED) {
                        if (input.substr(peg$currPos, 4) === peg$c38) {
                          s1 = peg$c38;
                          peg$currPos += 4;
                        } else {
                          s1 = peg$FAILED;
                          if (peg$silentFails === 0) {
                            peg$fail(peg$e40);
                          }
                        }
                        if (s1 === peg$FAILED) {
                          if (input.substr(peg$currPos, 3) === peg$c39) {
                            s1 = peg$c39;
                            peg$currPos += 3;
                          } else {
                            s1 = peg$FAILED;
                            if (peg$silentFails === 0) {
                              peg$fail(peg$e41);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (s1 !== peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 40) {
          s2 = peg$c27;
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e29);
          }
        }
        if (s2 !== peg$FAILED) {
          peg$parse_();
          s4 = peg$parseExpression();
          if (s4 !== peg$FAILED) {
            peg$parse_();
            if (input.charCodeAt(peg$currPos) === 41) {
              s6 = peg$c28;
              peg$currPos++;
            } else {
              s6 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e30);
              }
            }
            if (s6 !== peg$FAILED) {
              peg$savedPos = s0;
              s0 = peg$f21(s1, s4);
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.substr(peg$currPos, 3) === peg$c40) {
          s1 = peg$c40;
          peg$currPos += 3;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e42);
          }
        }
        if (s1 === peg$FAILED) {
          if (input.substr(peg$currPos, 3) === peg$c10) {
            s1 = peg$c10;
            peg$currPos += 3;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e12);
            }
          }
          if (s1 === peg$FAILED) {
            if (input.substr(peg$currPos, 3) === peg$c11) {
              s1 = peg$c11;
              peg$currPos += 3;
            } else {
              s1 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e13);
              }
            }
          }
        }
        if (s1 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 40) {
            s2 = peg$c27;
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e29);
            }
          }
          if (s2 !== peg$FAILED) {
            peg$parse_();
            s4 = peg$parseExpression();
            if (s4 !== peg$FAILED) {
              peg$parse_();
              if (input.charCodeAt(peg$currPos) === 44) {
                s6 = peg$c1;
                peg$currPos++;
              } else {
                s6 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e1);
                }
              }
              if (s6 !== peg$FAILED) {
                peg$parse_();
                s8 = peg$parseExpression();
                if (s8 !== peg$FAILED) {
                  peg$parse_();
                  if (input.charCodeAt(peg$currPos) === 41) {
                    s10 = peg$c28;
                    peg$currPos++;
                  } else {
                    s10 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e30);
                    }
                  }
                  if (s10 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f22(s1, s4, s8);
                  } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$FAILED;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$FAILED;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      return s0;
    }
    function peg$parseFloatNumber() {
      var s0, s2, s3, s4, s5;
      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 45) {
        peg$currPos++;
      } else {
        if (peg$silentFails === 0) {
          peg$fail(peg$e43);
        }
      }
      s2 = peg$parseNumber();
      if (s2 !== peg$FAILED) {
        s3 = peg$currPos;
        if (peg$r2.test(input.charAt(peg$currPos))) {
          s4 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s4 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e44);
          }
        }
        if (s4 !== peg$FAILED) {
          s5 = peg$parseNumber();
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        if (s3 === peg$FAILED) {
          s3 = null;
        }
        peg$savedPos = s0;
        s0 = peg$f23();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseIntegerNumber() {
      var s0, s1, s2, s3;
      s0 = peg$currPos;
      if (peg$r3.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e45);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        if (peg$r4.test(input.charAt(peg$currPos))) {
          s3 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e46);
          }
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          if (peg$r4.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e46);
            }
          }
        }
        peg$savedPos = s0;
        s0 = peg$f24();
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseNumber() {
      var s0, s1, s2;
      s0 = peg$currPos;
      s1 = [];
      if (peg$r4.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e46);
        }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$r4.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e46);
            }
          }
        }
      } else {
        s1 = peg$FAILED;
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f25();
      }
      s0 = s1;
      return s0;
    }
    function peg$parseOperator() {
      var s0, s1;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c42) {
        s1 = peg$c42;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e47);
        }
      }
      if (s1 !== peg$FAILED) {
        peg$savedPos = s0;
        s1 = peg$f26();
      }
      s0 = s1;
      if (s0 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 42) {
          s0 = peg$c43;
          peg$currPos++;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e48);
          }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 94) {
            s0 = peg$c44;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e49);
            }
          }
          if (s0 === peg$FAILED) {
            if (input.charCodeAt(peg$currPos) === 37) {
              s0 = peg$c45;
              peg$currPos++;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e50);
              }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 47) {
                s0 = peg$c46;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                  peg$fail(peg$e51);
                }
              }
              if (s0 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 43) {
                  s0 = peg$c47;
                  peg$currPos++;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) {
                    peg$fail(peg$e52);
                  }
                }
                if (s0 === peg$FAILED) {
                  if (input.charCodeAt(peg$currPos) === 45) {
                    s0 = peg$c41;
                    peg$currPos++;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) {
                      peg$fail(peg$e43);
                    }
                  }
                }
              }
            }
          }
        }
      }
      return s0;
    }
    function peg$parseComment() {
      var s0;
      peg$silentFails++;
      s0 = peg$parseMultiLineComment();
      if (s0 === peg$FAILED) {
        s0 = peg$parseSingleLineComment();
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        if (peg$silentFails === 0) {
          peg$fail(peg$e53);
        }
      }
      return s0;
    }
    function peg$parseMultiLineComment() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c48) {
        s1 = peg$c48;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e54);
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        if (input.substr(peg$currPos, 2) === peg$c49) {
          s5 = peg$c49;
          peg$currPos += 2;
        } else {
          s5 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e55);
          }
        }
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = undefined;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e56);
            }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          if (input.substr(peg$currPos, 2) === peg$c49) {
            s5 = peg$c49;
            peg$currPos += 2;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e55);
            }
          }
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = undefined;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e56);
              }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        if (input.substr(peg$currPos, 2) === peg$c49) {
          s3 = peg$c49;
          peg$currPos += 2;
        } else {
          s3 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e55);
          }
        }
        if (s3 !== peg$FAILED) {
          peg$savedPos = s0;
          s0 = peg$f27(s2);
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 91) {
          s1 = peg$c50;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e57);
          }
        }
        if (s1 !== peg$FAILED) {
          s2 = [];
          if (peg$r5.test(input.charAt(peg$currPos))) {
            s3 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e58);
            }
          }
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            if (peg$r5.test(input.charAt(peg$currPos))) {
              s3 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s3 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e58);
              }
            }
          }
          if (input.charCodeAt(peg$currPos) === 93) {
            s3 = peg$c51;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e59);
            }
          }
          if (s3 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f28(s2);
          } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$FAILED;
        }
      }
      return s0;
    }
    function peg$parseSingleLineComment() {
      var s0, s1, s2, s3, s4, s5;
      s0 = peg$currPos;
      if (input.substr(peg$currPos, 2) === peg$c52) {
        s1 = peg$c52;
        peg$currPos += 2;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e60);
        }
      }
      if (s1 === peg$FAILED) {
        if (input.charCodeAt(peg$currPos) === 35) {
          s1 = peg$c53;
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) {
            peg$fail(peg$e61);
          }
        }
      }
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$currPos;
        s4 = peg$currPos;
        peg$silentFails++;
        s5 = peg$parseLineTerminator();
        peg$silentFails--;
        if (s5 === peg$FAILED) {
          s4 = undefined;
        } else {
          peg$currPos = s4;
          s4 = peg$FAILED;
        }
        if (s4 !== peg$FAILED) {
          if (input.length > peg$currPos) {
            s5 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s5 = peg$FAILED;
            if (peg$silentFails === 0) {
              peg$fail(peg$e56);
            }
          }
          if (s5 !== peg$FAILED) {
            s4 = [s4, s5];
            s3 = s4;
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        } else {
          peg$currPos = s3;
          s3 = peg$FAILED;
        }
        while (s3 !== peg$FAILED) {
          s2.push(s3);
          s3 = peg$currPos;
          s4 = peg$currPos;
          peg$silentFails++;
          s5 = peg$parseLineTerminator();
          peg$silentFails--;
          if (s5 === peg$FAILED) {
            s4 = undefined;
          } else {
            peg$currPos = s4;
            s4 = peg$FAILED;
          }
          if (s4 !== peg$FAILED) {
            if (input.length > peg$currPos) {
              s5 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s5 = peg$FAILED;
              if (peg$silentFails === 0) {
                peg$fail(peg$e56);
              }
            }
            if (s5 !== peg$FAILED) {
              s4 = [s4, s5];
              s3 = s4;
            } else {
              peg$currPos = s3;
              s3 = peg$FAILED;
            }
          } else {
            peg$currPos = s3;
            s3 = peg$FAILED;
          }
        }
        peg$savedPos = s0;
        s0 = peg$f29(s2);
      } else {
        peg$currPos = s0;
        s0 = peg$FAILED;
      }
      return s0;
    }
    function peg$parseLineTerminator() {
      var s0;
      if (peg$r6.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e62);
        }
      }
      return s0;
    }
    function peg$parseWhiteSpace() {
      var s0;
      peg$silentFails++;
      if (peg$r7.test(input.charAt(peg$currPos))) {
        s0 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) {
          peg$fail(peg$e64);
        }
      }
      peg$silentFails--;
      if (s0 === peg$FAILED) {
        if (peg$silentFails === 0) {
          peg$fail(peg$e63);
        }
      }
      return s0;
    }
    function peg$parse_() {
      var s0, s1;
      s0 = [];
      s1 = peg$parseWhiteSpace();
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
      }
      return s0;
    }
    function peg$parse__() {
      var s0, s1;
      peg$silentFails++;
      s0 = [];
      s1 = peg$parseWhiteSpace();
      if (s1 === peg$FAILED) {
        s1 = peg$parseComment();
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        s1 = peg$parseWhiteSpace();
        if (s1 === peg$FAILED) {
          s1 = peg$parseComment();
        }
      }
      peg$silentFails--;
      s1 = peg$FAILED;
      if (peg$silentFails === 0) {
        peg$fail(peg$e65);
      }
      return s0;
    }
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail(peg$endExpectation());
      }
      throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1) : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
  }

  /**
   * The `Parser` takes a notation string and parses it into objects.
   *
   * It is used internally by the DiceRoll object when rolling notation, but can be used by itself if
   * necessary.
   *
   * @see {@link https://dice-roller.github.io/documentation/guide/notation/}
   * @see {@link https://en.m.wikipedia.org/wiki/Dice_notation}
   */
  class Parser {
    /**
     * Parses the given dice notation and returns a list of dice and modifiers found
     *
     * @param {string} notation The notation to parse
     *
     * @returns {Array}
     *
     * @throws {RequiredArgumentError} Notation is required
     * @throws {SyntaxError} The notation syntax is invalid
     * @throws {TypeError} Notation must be a string
     */
    static parse(notation) {
      if (!notation) {
        throw new RequiredArgumentError('notation');
      }
      if (typeof notation !== 'string') {
        throw new TypeError('Notation must be a string');
      }

      // parse the notation
      return peg$parse(notation);
    }
  }

  /**
   * Allowed formats for exporting dice data
   *
   * @readonly
   *
   * @type {Readonly<{BASE_64: number, JSON: number, OBJECT: number}>}
   *
   * @property {number} BASE_64
   * @property {number} JSON
   * @property {number} OBJECT
   */
  const exportFormats = Object.freeze({
    BASE_64: 1,
    JSON: 0,
    OBJECT: 2
  });

  /**
   * The notation
   *
   * @type {symbol}
   *
   * @private
   */
  const notationSymbol = Symbol('notation');

  /**
   * The maximum possible roll total
   *
   * @type {symbol}
   *
   * @private
   */
  const maxTotalSymbol = Symbol('maxTotal');

  /**
   * The minimum possible roll total
   *
   * @type {symbol}
   *
   * @private
   */
  const minTotalSymbol = Symbol('minTotal');

  /**
   * List of expressions to roll
   *
   * @type {symbol}
   *
   * @private
   */
  const expressionsSymbol = Symbol('expressions');

  /**
   * Method for rolling dice
   *
   * @type {symbol}
   *
   * @private
   */
  const rollMethodSymbol = Symbol('roll-method');

  /**
   * List of rolls
   *
   * @type {symbol}
   *
   * @private
   */
  const rollsSymbol = Symbol('rolls');

  /**
   * Set the rolls
   *
   * @private
   *
   * @type {symbol}
   */
  const setRollsSymbol = Symbol('set-rolls');

  /**
   * The roll total
   *
   * @type {symbol}
   *
   * @private
   */
  const totalSymbol = Symbol('total');

  /**
   * Calculate the total of all the results, fixed to a max of 2 digits after the decimal point.
   *
   * @private
   *
   * @param {ResultGroup} results
   *
   * @returns {Number} the results total
   */
  const calculateTotal = results => toFixed(results.calculationValue, 2);

  /**
   * A `DiceRoll` handles rolling of a single dice notation and storing the result.
   *
   * @see {@link DiceRoller} if you need to keep a history of rolls
   */
  class DiceRoll {
    /* eslint-disable max-len */
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
    constructor(notation) {
      if (!notation) {
        throw new RequiredArgumentError('notation');
      }

      // initialise the parsed dice array
      this[expressionsSymbol] = [];
      if (notation instanceof Object && !Array.isArray(notation)) {
        // validate object
        // @todo see if we can assert that the notation is valid
        if (!notation.notation) {
          // object doesn't contain a notation property
          throw new RequiredArgumentError('notation');
        } else if (typeof notation.notation !== 'string') {
          throw new NotationError(notation.notation);
        } else if (notation.rolls) {
          // we have rolls - store them
          this[setRollsSymbol](notation.rolls);
        }

        // store the notation
        this[notationSymbol] = notation.notation;

        // parse the notation
        this[expressionsSymbol] = Parser.parse(this.notation);
        if (!this.hasRolls()) {
          // no rolls - roll the dice
          this.roll();
        }
      } else if (typeof notation === 'string') {
        // @todo see if we can assert that the notation is valid
        // store the notation
        this[notationSymbol] = notation;

        // parse the notation
        this[expressionsSymbol] = Parser.parse(this.notation);

        // roll the dice
        this.roll();
      } else {
        throw new NotationError(notation);
      }
    }
    /* eslint-enable max-len */

    /**
     * The average possible total for the notation.
     *
     * @since 4.3.0
     *
     * @returns {number}
     */
    get averageTotal() {
      return (this.maxTotal + this.minTotal) / 2;
    }

    /**
     * The maximum possible total for the notation.
     *
     * @since 4.3.0
     *
     * @returns {number}
     */
    get maxTotal() {
      if (!this.hasExpressions()) {
        return 0;
      }

      // only calculate the total if it has not already been done
      if (!this[maxTotalSymbol]) {
        // roll the dice, forcing values to their maximum
        const rolls = this[rollMethodSymbol](engines.max);

        // calculate the total
        this[maxTotalSymbol] = calculateTotal(rolls);
      }

      // return the total
      return this[maxTotalSymbol];
    }

    /**
     * The minimum possible total for the notation.
     *
     * @since 4.3.0
     *
     * @returns {number}
     */
    get minTotal() {
      if (!this.hasExpressions()) {
        return 0;
      }

      // only calculate the total if it has not already been done
      if (!this[minTotalSymbol]) {
        // roll the dice, forcing values to their minimum
        const rolls = this[rollMethodSymbol](engines.min);

        // calculate the total
        this[minTotalSymbol] = calculateTotal(rolls);
      }

      // return the total
      return this[minTotalSymbol];
    }

    /**
     * The dice notation.
     *
     * @returns {string}
     */
    get notation() {
      return this[notationSymbol];
    }

    /**
     * String representation of the rolls
     *
     * @example
     * 2d20+1d6: [20,2]+[2] = 24
     *
     * @returns {string}
     */
    get output() {
      let output = `${this.notation}: `;
      if (this.hasRolls()) {
        output += `${this[rollsSymbol]} = ${this.total}`;
      } else {
        output += 'No dice rolled';
      }
      return output;
    }

    /**
     * The dice rolled for the notation
     *
     * @returns {Array.<ResultGroup|RollResults|string|number>}
     */
    get rolls() {
      return this[rollsSymbol] ? this[rollsSymbol].results : [];
    }

    /**
     * The roll total
     *
     * @returns {number}
     */
    get total() {
      // only calculate the total if it has not already been done
      if (!this[totalSymbol] && this.hasRolls()) {
        this[totalSymbol] = calculateTotal(this[rollsSymbol]);
      }

      // return the total
      return this[totalSymbol] || 0;
    }

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
    export() {
      let format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : exportFormats.JSON;
      switch (format) {
        case exportFormats.BASE_64:
          // JSON encode then base64, else it exports the string representation of the roll output
          return btoa(this.export(exportFormats.JSON));
        case exportFormats.JSON:
          return JSON.stringify(this);
        case exportFormats.OBJECT:
          return JSON.parse(this.export(exportFormats.JSON));
        default:
          throw new TypeError(`Invalid export format "${format}"`);
      }
    }

    /**
     * Check whether the DiceRoll has expressions or not.
     *
     * @returns {boolean} `true` if the object has expressions, `false` otherwise
     */
    hasExpressions() {
      return this[expressionsSymbol] && this[expressionsSymbol].length > 0;
    }

    /**
     * Check whether the object has rolled dice or not
     *
     * @returns {boolean} `true` if the object has rolls, `false` otherwise
     */
    hasRolls() {
      return this.hasExpressions() && this.rolls.length > 0;
    }

    /**
     * Roll the dice for the stored notation.
     *
     * This is called in the constructor, so you'll only need this if you want to re-roll the
     * notation. However, it's usually better to create a new `DiceRoll` instance instead.
     *
     * @returns {RollResults[]} The results of the rolls
     */
    roll() {
      // reset the cached total
      this[totalSymbol] = 0;

      // save the rolls to the log
      this[rollsSymbol] = this[rollMethodSymbol]();

      // return the rolls;
      return this.rolls;
    }

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
    toJSON() {
      const {
        averageTotal,
        maxTotal,
        minTotal,
        notation,
        output,
        rolls,
        total
      } = this;
      return {
        averageTotal,
        maxTotal,
        minTotal,
        notation,
        output,
        rolls,
        total,
        type: 'dice-roll'
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     *
     * @see {@link DiceRoll#output}
     */
    toString() {
      return this.output;
    }

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
    static import(data) {
      if (!data) {
        throw new RequiredArgumentError('data');
      } else if (isJson(data)) {
        // data is JSON format - parse and import
        return DiceRoll.import(JSON.parse(data));
      } else if (isBase64(data)) {
        // data is base64 encoded - decode and import
        return DiceRoll.import(atob(data));
      } else if (typeof data === 'object') {
        // if data is a `DiceRoll` return it, otherwise build it
        return new DiceRoll(data);
      } else {
        throw new DataFormatError(data);
      }
    }

    /**
     * Roll the dice and return the result.
     *
     * If the engine is passed, it will be used for the number generation for **this roll only**.
     * The engine will be reset after use.
     *
     * @private
     *
     * @param {{next(): number}} [engine] The RNG engine to use for die rolls
     *
     * @returns {ResultGroup} The result of the rolls
     *
     * @throws {TypeError} engine must have function `next()`
     */
    [rollMethodSymbol](engine) {
      let oEngine;
      if (engine) {
        // use the selected engine
        oEngine = generator.engine;
        generator.engine = engine;
      }

      // roll the dice
      const results = new ResultGroup(this[expressionsSymbol].map(expression => {
        if (expression instanceof StandardDice || expression instanceof RollGroup) {
          // roll the object and return the value
          return expression.roll();
        }
        return expression;
      })
      // filter out empty values (e.g. whitespace)
      .filter(value => !!value || value === 0));
      if (engine) {
        // reset the engine
        generator.engine = oEngine;
      }
      return results;
    }

    /* eslint-disable max-len */
    /**
     * Set the rolls.
     *
     * @private
     *
     * @param {ResultGroup|Array.<ResultGroup|RollResults|string|number|{}|Array.<RollResult|number>>} rolls
     *
     * @throws {TypeError} Rolls must be a valid result object, or an array
     */
    [setRollsSymbol](rolls) {
      if (rolls instanceof ResultGroup) {
        this[rollsSymbol] = rolls;
      } else if (rolls instanceof RollResults) {
        this[rollsSymbol] = new ResultGroup([rolls]);
      } else if (Array.isArray(rolls)) {
        this[rollsSymbol] = new ResultGroup(rolls.map(roll => {
          if (roll instanceof ResultGroup || roll instanceof RollResults) {
            // already a RollResults object
            return roll;
          }

          // @todo should this be a ResultGroup, or a RollResults?
          if (Array.isArray(roll)) {
            // array of values
            return new RollResults(roll);
          }
          if (typeof roll === 'object') {
            // a result group
            if (Array.isArray(roll.results)) {
              return new ResultGroup(roll.results, roll.modifiers || [], roll.isRollGroup || false, typeof roll.useInTotal === 'boolean' ? roll.useInTotal : true);
            }
            // roll results
            if (Array.isArray(roll.rolls)) {
              return new RollResults(roll.rolls);
            }
          }
          return roll;
        }));
      } else {
        throw new TypeError('Rolls must be a valid result object, or an array');
      }
    }
    /* eslint-enable max-len */
  }

  /**
   * history of log rolls
   *
   * @type {symbol}
   *
   * @private
   */
  const logSymbol = Symbol('log');

  /**
   * A `DiceRoller` handles dice rolling functionality, keeps a history of rolls and can output logs
   * etc.
   *
   * @see {@link DiceRoll} if you don't need to keep a log history of rolls
   */
  class DiceRoller {
    /**
     * Create a DiceRoller.
     *
     * The optional `data` property should be either an array of `DiceRoll` objects, or an object with
     * a `log` property that contains the `DiceRoll` objects.
     *
     * @param {{log: DiceRoll[]}|DiceRoll[]} [data] The data to import
     * @param {DiceRoll[]} [data.log] If `data` is an object, it must contain an array of `DiceRoll`s
     *
     * @throws {TypeError} if data is an object, it must have a `log[]` property
     */
    constructor(data) {
      this[logSymbol] = [];
      if (data) {
        this.import(data);
      }
    }

    /**
     * The list of roll logs.
     *
     * @returns {DiceRoll[]}
     */
    get log() {
      return this[logSymbol] || [];
    }

    /**
     * String representation of the rolls in the log
     *
     * @example
     * 2d20+1d6: [20,2]+[2] = 24; 1d8: [6] = 6
     *
     * @returns {string}
     */
    get output() {
      return this.log.join('; ');
    }

    /**
     * The sum of all the rolls in the log
     *
     * @see {@link DiceRoller#log}
     *
     * @returns {number}
     */
    get total() {
      return this.log.reduce((prev, current) => prev + current.total, 0);
    }

    /**
     * Clear the roll history log.
     *
     * @see {@link DiceRoller#log}
     */
    clearLog() {
      this[logSymbol].length = 0;
    }

    /**
     * Export the object in the given format.
     * If no format is specified, JSON is returned.
     *
     * @see {@link DiceRoller#toJSON}
     *
     * @param {exportFormats} [format=exportFormats#JSON] The format to export the data as
     *
     * @returns {string|null} The exported data, in the specified format
     *
     * @throws {TypeError} Invalid export format
     */
    export() {
      let format = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : exportFormats.JSON;
      switch (format) {
        case exportFormats.BASE_64:
          // JSON encode, then base64
          return btoa(this.export(exportFormats.JSON));
        case exportFormats.JSON:
          return JSON.stringify(this);
        case exportFormats.OBJECT:
          return JSON.parse(this.export(exportFormats.JSON));
        default:
          throw new TypeError(`Invalid export format "${format}"`);
      }
    }

    /**
     * Add the data to the existing [roll log]{@link DiceRoller#log}.
     *
     * `data` can be an array of `DiceRoll` objects, an object with a `log` property that contains
     * `DiceRoll` objects, or a JSON / base64 encoded representation of either.
     *
     * @see {@link DiceRoller#log}
     *
     * @param {string|{log: DiceRoll[]}|DiceRoll[]} data The data to import
     * @param {DiceRoll[]} [data.log] If `data` is an object, it must contain an array of `DiceRoll`s
     *
     * @returns {DiceRoll[]} The roll log
     *
     * @throws {DataFormatError} data format invalid
     * @throws {RequiredArgumentError} data is required
     * @throws {TypeError} log must be an array
     */
    import(data) {
      if (!data) {
        throw new RequiredArgumentError('data');
      } else if (isJson(data)) {
        // data is JSON - parse and import
        return this.import(JSON.parse(data));
      } else if (isBase64(data)) {
        // data is base64 encoded - decode an import
        return this.import(atob(data));
      } else if (typeof data === 'object') {
        let log = data.log || null;
        if (!data.log && Array.isArray(data) && data.length) {
          // if `log` is not defined, but data is an array, use it as the list of logs
          log = data;
        }
        if (log && Array.isArray(log)) {
          // loop through each log entry and import it
          log.forEach(roll => {
            this[logSymbol].push(DiceRoll.import(roll));
          });
        } else if (log) {
          throw new TypeError('log must be an array');
        }
        return this.log;
      } else {
        throw new DataFormatError(data);
      }
    }

    /**
     * Roll the given dice notation(s) and return the corresponding `DiceRoll` objects.
     *
     * You can roll a single notation, or multiple at once.
     *
     * @example <caption>Single notation</caption>
     * diceRoller.roll('2d6');
     *
     * @example <caption>Multiple notations</caption>
     * roll('2d6', '4d10', 'd8+4d6');
     *
     * @param {...string} notations The notations to roll
     *
     * @returns {DiceRoll|DiceRoll[]} If a single notation is passed, a single `DiceRoll` is returned,
     * otherwise an array of `DiceRoll` objects is returned
     *
     * @throws {NotationError} notation is invalid
     * @throws {RequiredArgumentError} notation is required
     */
    roll() {
      for (var _len = arguments.length, notations = new Array(_len), _key = 0; _key < _len; _key++) {
        notations[_key] = arguments[_key];
      }
      const filteredNotations = notations.filter(Boolean);
      if (filteredNotations.length === 0) {
        throw new RequiredArgumentError('notations');
      }
      const rolls = filteredNotations.map(notation => {
        const diceRoll = new DiceRoll(notation);

        // add the roll log to our global log
        this[logSymbol].push(diceRoll);

        // return the current DiceRoll
        return diceRoll;
      });
      return rolls.length > 1 ? rolls : rolls[0];
    }

    /**
     * Return an object for JSON serialising.
     *
     * This is called automatically when JSON encoding the object.
     *
     * @returns {{output: string, total: number, log: DiceRoll[], type: string}}
     */
    toJSON() {
      const {
        log,
        output,
        total
      } = this;
      return {
        log,
        output,
        total,
        type: 'dice-roller'
      };
    }

    /**
     * Return the String representation of the object.
     *
     * This is called automatically when casting the object to a string.
     *
     * @returns {string}
     *
     * @see {@link DiceRoller#output}
     */
    toString() {
      return this.output;
    }

    /**
     * Create a new `DiceRoller` instance with the given data.
     *
     * `data` can be an array of `DiceRoll` objects, an object with a `log` property that contains the
     * `DiceRoll` objects, or a JSON / base64 encoded representation of either.
     *
     * @see instance method {@link DiceRoller#import}
     *
     * @param {string|{log: DiceRoll[]}|DiceRoll[]} data The data to import
     * @param {DiceRoll[]} [data.log] If `data` is an object, it must contain an array of `DiceRoll`s
     *
     * @returns {DiceRoller} The new `DiceRoller` instance
     *
     * @throws {DataFormatError} data format invalid
     * @throws {RequiredArgumentError} data is required
     * @throws {TypeError} log must be an array
     */
    static import(data) {
      // create a new DiceRoller object
      const diceRoller = new DiceRoller();

      // import the data
      diceRoller.import(data);

      // return the DiceRoller
      return diceRoller;
    }
  }

  exports.ComparePoint = ComparePoint;
  exports.Dice = index$2;
  exports.DiceRoll = DiceRoll;
  exports.DiceRoller = DiceRoller;
  exports.Exceptions = index$3;
  exports.Modifiers = index$1;
  exports.NumberGenerator = NumberGenerator$1;
  exports.Parser = Parser;
  exports.Results = index;
  exports.RollGroup = RollGroup;
  exports.exportFormats = exportFormats;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
