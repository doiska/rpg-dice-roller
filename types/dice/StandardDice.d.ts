export default StandardDice;
/**
 * Represents a standard numerical die.
 */
declare class StandardDice extends HasDescription {
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
    constructor(sides: number, qty?: number | undefined, modifiers?: {} | Map<string, Modifier> | Modifier[] | null | undefined, min?: number | null | undefined, max?: number | null | undefined, description?: Description | string | null);
    /**
     * Set the modifiers that affect this roll.
     *
     * @param {Map<string, Modifier>|Modifier[]|{}|null} value
     *
     * @throws {TypeError} Modifiers should be a Map, array of Modifiers, or an Object
     */
    set modifiers(arg: Map<string, Modifier> | null);
    /**
     * The modifiers that affect this die roll.
     *
     * @returns {Map<string, Modifier>|null}
     */
    get modifiers(): Map<string, Modifier> | null;
    /**
     * The average value that the die can roll (Excluding modifiers).
     *
     * @returns {number}
     */
    get average(): number;
    /**
     * The maximum value that can be rolled on the die, excluding modifiers.
     *
     * @returns {number}
     */
    get max(): number;
    /**
     * The minimum value that can be rolled on the die, excluding modifiers.
     *
     * @returns {number}
     */
    get min(): number;
    /**
     * The name of the die.
     *
     * @returns {string} 'standard'
     */
    get name(): string;
    /**
     * The dice notation. e.g. `4d6!`.
     *
     * @returns {string}
     */
    get notation(): string;
    /**
     * The number of dice that should be rolled.
     *
     * @returns {number}
     */
    get qty(): number;
    /**
     * The number of sides the die has.
     *
     * @returns {number}
     */
    get sides(): number;
    /**
     * Roll the dice for the specified quantity and apply any modifiers.
     *
     * @returns {RollResults} The result of the roll
     */
    roll(): RollResults;
    /**
     * Roll a single die and return the value.
     *
     * @returns {RollResult} The value rolled
     */
    rollOnce(): RollResult;
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
    toJSON(): {
        average: number;
        min: number;
        max: number;
        notation: string;
        qty: number;
        name: string;
        sides: number;
        modifiers: (Map<string, Modifier> | null);
        type: string;
    };
    [qtySymbol]: number;
    [sidesSymbol]: number;
    [minSymbol]: number;
    [maxSymbol]: number;
    [modifiersSymbol]: Map<any, any> | undefined;
}
import HasDescription from "../traits/HasDescription.js";
import Modifier from "../modifiers/Modifier.js";
import RollResults from "../results/RollResults.js";
import RollResult from "../results/RollResult.js";
declare const qtySymbol: unique symbol;
declare const sidesSymbol: unique symbol;
declare const minSymbol: unique symbol;
declare const maxSymbol: unique symbol;
declare const modifiersSymbol: unique symbol;
