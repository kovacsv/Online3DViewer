export function GetIntegerFromStyle(parameter: any): number;
export function GetDomElementExternalWidth(style: any): number;
export function GetDomElementExternalHeight(style: any): number;
export function GetDomElementInnerDimensions(element: any, outerWidth: any, outerHeight: any): {
    width: number;
    height: number;
};
export function GetDomElementClientCoordinates(element: any, clientX: any, clientY: any): Coord2D;
export function CreateDomElement(elementType: any, className: any, innerHTML: any): any;
export function AddDomElement(parentElement: any, elementType: any, className: any, innerHTML: any): any;
export function AddDiv(parentElement: any, className: any, innerHTML: any): any;
export function ClearDomElement(element: any): void;
export function InsertDomElementBefore(newElement: any, existingElement: any): void;
export function InsertDomElementAfter(newElement: any, existingElement: any): void;
export function ShowDomElement(element: any, show: any): void;
export function IsDomElementVisible(element: any): boolean;
export function SetDomElementWidth(element: any, width: any): void;
export function SetDomElementHeight(element: any, height: any): void;
export function GetDomElementOuterWidth(element: any): any;
export function GetDomElementOuterHeight(element: any): any;
export function SetDomElementOuterWidth(element: any, width: any): void;
export function SetDomElementOuterHeight(element: any, height: any): void;
export function CreateDiv(className: any, innerHTML: any): any;
import { Coord2D } from "../geometry/coord2d.js";
//# sourceMappingURL=domutils.d.ts.map