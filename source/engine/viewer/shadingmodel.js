import { SubCoord3D } from '../geometry/coord3d.js';
import { CameraMode } from '../viewer/camera.js';
import { ConvertColorToThreeColor, ShadingType } from '../threejs/threeutils.js';

import * as THREE from 'three';

/**
 * Environment settings object.
 */
export class EnvironmentSettings
{
    /**
     * @param {string[]} textureNames Urls of the environment map images in this order:
     * posx, negx, posy, negy, posz, negz.
     * @param {boolean} backgroundIsEnvMap Use the environment map as background.
     */
    constructor (textureNames, backgroundIsEnvMap)
    {
        this.textureNames = textureNames;
        this.backgroundIsEnvMap = backgroundIsEnvMap;
    }

    /**
     * Creates a clone of the object.
     * @returns {EnvironmentSettings}
     */
    Clone ()
    {
        let textureNames = null;
        if (this.textureNames !== null) {
            textureNames = [];
            for (let textureName of this.textureNames) {
                textureNames.push (textureName);
            }
        }
        return new EnvironmentSettings (textureNames, this.backgroundIsEnvMap);
    }
}

export class ShadingModel
{
    constructor (scene)
    {
        this.scene = scene;

        this.type = ShadingType.Phong;
        this.cameraMode = CameraMode.Perspective;
        this.ambientLight = new THREE.AmbientLight (0x888888);
        this.directionalLight = new THREE.DirectionalLight (0x888888);
        this.environmentSettings = new EnvironmentSettings (null, false);
        this.environment = null;

        this.scene.add (this.ambientLight);
        this.scene.add (this.directionalLight);
    }

    SetShadingType (type)
    {
        this.type = type;
        this.UpdateShading ();
    }

    SetCameraMode (cameraMode)
    {
        this.cameraMode = cameraMode;
        this.UpdateShading ();
    }

    UpdateShading ()
    {
        if (this.type === ShadingType.Phong) {
            this.ambientLight.color.set (0x888888);
            this.directionalLight.color.set (0x888888);
            this.scene.environment = null;
        } else if (this.type === ShadingType.Physical) {
            this.ambientLight.color.set (0x000000);
            this.directionalLight.color.set (0x555555);
            this.scene.environment = this.environment;
        }
        if (this.environmentSettings.backgroundIsEnvMap && this.cameraMode === CameraMode.Perspective) {
            this.scene.background = this.environment;
        } else {
            this.scene.background = null;
        }
    }

    SetEnvironmentMapSettings (environmentSettings, onLoaded)
    {
        let loader = new THREE.CubeTextureLoader ();
        this.environment = loader.load (environmentSettings.textureNames, (texture) => {
            texture.colorSpace = THREE.LinearSRGBColorSpace;
            onLoaded ();
        });
        this.environmentSettings = environmentSettings;
    }

    UpdateByCamera (camera)
    {
        const lightDir = SubCoord3D (camera.eye, camera.center);
        this.directionalLight.position.set (lightDir.x, lightDir.y, lightDir.z);
    }

    CreateHighlightMaterial (highlightColor, withOffset)
    {
        let material = null;
        if (this.type === ShadingType.Phong) {
            material = new THREE.MeshPhongMaterial ({
                color : ConvertColorToThreeColor (highlightColor),
                side : THREE.DoubleSide
            });
        } else if (this.type === ShadingType.Physical) {
            material = new THREE.MeshStandardMaterial ({
                color : ConvertColorToThreeColor (highlightColor),
                side : THREE.DoubleSide
            });
        }
        if (material !== null && withOffset) {
            material.polygonOffset = true;
            material.polygonOffsetUnit = 1;
            material.polygonOffsetFactor = 1;
        }
        return material;
    }
}
