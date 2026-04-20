export const Unit =
{
    Unknown : 0,
    Millimeter : 1,
    Centimeter : 2,
    Meter : 3,
    Inch : 4,
    Foot : 5
};

const LENGTH_CONVERSIONS = {
    1: 0.001,
    2: 0.01,
    3: 1,
    4: 0.0254,
    5: 0.3048,
};

const AREA_CONVERSIONS = {
    1: 0.000001,
    2: 0.0001,
    3: 1,
    4: 0.00064516,
    5: 0.09290304,
};

const VOLUME_CONVERSIONS = {
    1: 0.000000001,
    2: 0.000001,
    3: 1,
    4: 0.0000163871,
    5: 0.0283168466,
};

export function convertUnit({ value, fromUnit, toUnit, isArea = false, isVolume = false }) {
    if (isArea) {
        return (value * AREA_CONVERSIONS[fromUnit]) / AREA_CONVERSIONS[toUnit];
    }
    if (isVolume) {
        return (value * VOLUME_CONVERSIONS[fromUnit]) / VOLUME_CONVERSIONS[toUnit];
    }
    return (value * LENGTH_CONVERSIONS[fromUnit]) / LENGTH_CONVERSIONS[toUnit];
}
