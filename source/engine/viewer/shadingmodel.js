import { SubCoord3D } from '../geometry/coord3d.js';
import { CameraMode } from '../viewer/camera.js';
import { ShadingType } from '../threejs/threeutils.js';

import * as THREE from 'three';

export class ShadingModel
{
    constructor (scene)
    {
        this.scene = scene;

        this.type = ShadingType.Phong;
        this.cameraMode = CameraMode.Perspective;
        this.ambientLight = new THREE.AmbientLight (0x888888);
        this.directionalLight = new THREE.DirectionalLight (0x888888);
        this.environment = null;
        this.backgroundIsEnvMap = false;

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
        if (this.backgroundIsEnvMap && this.cameraMode === CameraMode.Perspective) {
            this.scene.background = this.environment;
        } else {
            this.scene.background = null;
        }
    }

    SetEnvironment (textures, useAsBackground, onLoaded)
    {
        let loader = new THREE.CubeTextureLoader ();
        this.environment = loader.load (textures, () => {
            onLoaded ();
        });
        this.backgroundIsEnvMap = useAsBackground;
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
                color : highlightColor,
                side : THREE.DoubleSide
            });
        } else if (this.type === ShadingType.Physical) {
            material = new THREE.MeshStandardMaterial ({
                color : highlightColor,
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
