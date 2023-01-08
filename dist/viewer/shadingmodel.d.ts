/**
 * Environment settings object.
 */
export class EnvironmentSettings {
    /**
     * @param {string[]} textureNames Urls of the environment map images in this order:
     * posx, negx, posy, negy, posz, negz.
     * @param {boolean} backgroundIsEnvMap Use the environment map as background.
     */
    constructor(textureNames: string[], backgroundIsEnvMap: boolean);
    textureNames: string[];
    backgroundIsEnvMap: boolean;
    /**
     * Creates a clone of the object.
     * @returns {EnvironmentSettings}
     */
    Clone(): EnvironmentSettings;
}
export class ShadingModel {
    constructor(scene: any);
    scene: any;
    type: number;
    cameraMode: number;
    ambientLight: any;
    directionalLight: any;
    environmentSettings: EnvironmentSettings;
    environment: any;
    SetShadingType(type: any): void;
    SetCameraMode(cameraMode: any): void;
    UpdateShading(): void;
    SetEnvironmentMapSettings(environmentSettings: any, onLoaded: any): void;
    UpdateByCamera(camera: any): void;
    CreateHighlightMaterial(highlightColor: any, withOffset: any): any;
}
//# sourceMappingURL=shadingmodel.d.ts.map