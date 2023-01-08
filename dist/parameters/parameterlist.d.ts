export function CreateUrlBuilder(): ParameterListBuilder;
export function CreateUrlParser(urlParams: any): ParameterListParser;
export function CreateModelUrlParameters(urls: any): string;
export namespace ParameterConverter {
    function IntegerToString(integer: any): any;
    function StringToInteger(str: any): number;
    function NumberToString(number: any): any;
    function StringToNumber(str: any): number;
    function ModelUrlsToString(urls: any): any;
    function StringToModelUrls(str: any): any;
    function CameraToString(camera: any): string;
    function CameraModeToString(cameraMode: any): "perspective" | "orthographic";
    function StringToCamera(str: any): Camera;
    function StringToCameraMode(str: any): number;
    function RGBColorToString(color: any): string;
    function RGBAColorToString(color: any): string;
    function StringToRGBColor(str: any): RGBColor;
    function StringToRGBAColor(str: any): RGBAColor;
    function EnvironmentSettingsToString(environmentSettings: any): string;
    function StringToEnvironmentSettings(str: any): {
        environmentMapName: any;
        backgroundIsEnvMap: boolean;
    };
    function EdgeSettingsToString(edgeSettings: any): string;
    function StringToEdgeSettings(str: any): EdgeSettings;
}
export class ParameterListBuilder {
    constructor(separator: any);
    separator: any;
    paramList: string;
    AddModelUrls(urls: any): ParameterListBuilder;
    AddCamera(camera: any): ParameterListBuilder;
    AddCameraMode(cameraMode: any): ParameterListBuilder;
    AddEnvironmentSettings(envSettings: any): ParameterListBuilder;
    AddBackgroundColor(background: any): ParameterListBuilder;
    AddDefaultColor(color: any): ParameterListBuilder;
    AddEdgeSettings(edgeSettings: any): ParameterListBuilder;
    AddUrlPart(keyword: any, urlPart: any): void;
    GetParameterList(): string;
}
export class ParameterListParser {
    constructor(paramList: any, separator: any);
    separator: any;
    paramList: any;
    GetModelUrls(): any;
    GetCamera(): Camera;
    GetCameraMode(): number;
    GetEnvironmentSettings(): {
        environmentMapName: any;
        backgroundIsEnvMap: boolean;
    };
    GetBackgroundColor(): RGBAColor;
    GetDefaultColor(): RGBColor;
    GetEdgeSettings(): EdgeSettings;
    GetKeywordParams(keyword: any): any;
}
import { Camera } from "../viewer/camera.js";
import { RGBColor } from "../model/color.js";
import { RGBAColor } from "../model/color.js";
import { EdgeSettings } from "../viewer/viewermodel.js";
//# sourceMappingURL=parameterlist.d.ts.map