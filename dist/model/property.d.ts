export function PropertyToString(property: any): any;
export namespace PropertyType {
    const Text: number;
    const Integer: number;
    const Number: number;
    const Boolean: number;
    const Percent: number;
    const Color: number;
}
export class Property {
    constructor(type: any, name: any, value: any);
    type: any;
    name: any;
    value: any;
    Clone(): Property;
}
export class PropertyGroup {
    constructor(name: any);
    name: any;
    properties: any[];
    PropertyCount(): number;
    AddProperty(property: any): void;
    GetProperty(index: any): any;
    Clone(): PropertyGroup;
}
//# sourceMappingURL=property.d.ts.map