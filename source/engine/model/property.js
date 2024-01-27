import { EscapeHtmlChars } from '../core/core.js';
import { RGBColorToHexString } from './color.js';
import { Loc } from '../core/localization.js';

export const PropertyType =
{
    Text : 1,
    Integer : 2,
    Number : 3,
    Boolean : 4,
    Percent : 5,
    Color : 6
};

export class Property
{
    constructor (type, name, value)
    {
        this.type = type;
        this.name = name;
        this.value = value;
    }

    Clone ()
    {
        const clonable = (this.type === PropertyType.Color);
        if (clonable) {
            return new Property (this.type, this.name, this.value.Clone ());
        } else {
            return new Property (this.type, this.name, this.value);
        }
    }
}

export class PropertyGroup
{
    constructor (name)
    {
        this.name = name;
        this.properties = [];
    }

    PropertyCount ()
    {
        return this.properties.length;
    }

    AddProperty (property)
    {
        this.properties.push (property);
    }

    GetProperty (index)
    {
        return this.properties[index];
    }

    Clone ()
    {
        let cloned = new PropertyGroup (this.name);
        for (let property of this.properties) {
            cloned.AddProperty (property.Clone ());
        }
        return cloned;
    }
}

export function PropertyToString (property)
{
    if (property.type === PropertyType.Text) {
        return EscapeHtmlChars (property.value);
    } else if (property.type === PropertyType.Integer) {
        return property.value.toLocaleString ();
    } else if (property.type === PropertyType.Number) {
        return property.value.toLocaleString (undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } else if (property.type === PropertyType.Boolean) {
        return property.value ? Loc ('True') : Loc ('False');
    } else if (property.type === PropertyType.Percent) {
        return parseInt (property.value * 100, 10).toString () + '%';
    } else if (property.type === PropertyType.Color) {
        return '#' + RGBColorToHexString (property.value);
    }
    return null;
}
