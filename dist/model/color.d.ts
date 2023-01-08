export function ColorComponentFromFloat(component: any): number;
export function ColorComponentToFloat(component: any): number;
export function RGBColorFromFloatComponents(r: any, g: any, b: any): RGBColor;
export function SRGBToLinear(component: any): number;
export function LinearToSRGB(component: any): number;
export function IntegerToHexString(intVal: any): string;
export function RGBColorToHexString(color: any): string;
export function RGBAColorToHexString(color: any): string;
export function HexStringToRGBColor(hexString: any): RGBColor;
export function ArrayToRGBColor(arr: any): RGBColor;
export function RGBColorIsEqual(a: any, b: any): boolean;
/**
 * RGB color object. Components are integers in the range of 0..255.
 */
export class RGBColor {
    /**
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     */
    constructor(r: integer, g: integer, b: integer);
    r: integer;
    g: integer;
    b: integer;
    /**
     * Sets the value of all components.
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     */
    Set(r: integer, g: integer, b: integer): void;
    /**
     * Creates a clone of the object.
     * @returns {RGBColor}
     */
    Clone(): RGBColor;
}
/**
 * RGBA color object. Components are integers in the range of 0..255.
 */
export class RGBAColor {
    /**
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     * @param {integer} a Alpha component.
     */
    constructor(r: integer, g: integer, b: integer, a: integer);
    r: integer;
    g: integer;
    b: integer;
    a: integer;
    /**
     * Sets the value of all components.
     * @param {integer} r Red component.
     * @param {integer} g Green component.
     * @param {integer} b Blue component.
     * @param {integer} a Alpha component.
     */
    Set(r: integer, g: integer, b: integer, a: integer): void;
    /**
     * Creates a clone of the object.
     * @returns {RGBAColor}
     */
    Clone(): RGBAColor;
}
//# sourceMappingURL=color.d.ts.map