import { SubCoord3D } from '../geometry/coord3d.js';
import { ProjectionMode } from '../viewer/camera.js';
import { ShadingType } from '../threejs/threeutils.js';

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
        this.projectionMode = ProjectionMode.Perspective;
        this.ambientLight = new THREE.AmbientLight (0x888888, 1.0 * Math.PI);
        this.directionalLight = new THREE.DirectionalLight (0x888888, 1.0 * Math.PI);
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

    SetProjectionMode (projectionMode)
    {
        this.projectionMode = projectionMode;
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
        if (this.environmentSettings.backgroundIsEnvMap && this.projectionMode === ProjectionMode.Perspective) {
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
}
