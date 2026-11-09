import { ShadingType } from '../threejs/threeutils.js';

import * as THREE from 'three';

/**
 * Three.js overlay that paints prepared face highlights over the model. The painted triangles are
 * the model's own, so they lie on the same surface as the meshes and the surface strain overlay.
 * They are pulled forward by a polygon offset to win the depth test against them, see
 * {@link ViewerFaceHighlight#SetPolygonOffset}.
 */
export class ViewerFaceHighlight
{
    constructor (prepared)
    {
        this.prepared = prepared;
        this.rootObject = null;
    }

    CreateThreeObject (shadingType)
    {
        this.rootObject = new THREE.Object3D ();
        for (let instance of this.prepared) {
            let geometry = new THREE.BufferGeometry ();
            geometry.setAttribute ('position', new THREE.BufferAttribute (instance.positions, 3));
            geometry.setAttribute ('normal', new THREE.BufferAttribute (instance.normals, 3));
            geometry.setAttribute ('color', new THREE.BufferAttribute (instance.colors, 3));
            geometry.setIndex (new THREE.BufferAttribute (instance.indices, 1));

            let materialParams = {
                color : 0xffffff,
                vertexColors : true,
                side : THREE.DoubleSide,
                polygonOffset : true,
                polygonOffsetFactor : 0,
                polygonOffsetUnits : -1
            };
            let material = null;
            if (shadingType === ShadingType.Physical) {
                material = new THREE.MeshStandardMaterial (materialParams);
            } else {
                material = new THREE.MeshPhongMaterial (materialParams);
            }

            let threeMesh = new THREE.Mesh (geometry, material);
            threeMesh.userData = {
                faceHighlight : instance
            };
            this.rootObject.add (threeMesh);
        }
        return this.rootObject;
    }

    /**
     * The meshes and the surface strain overlay are pushed back by units 1 and the given factor
     * when they need a polygon offset. The painted faces take the same factor and units -1, so
     * they stay in front of the triangles they cover, and stay behind thick edge highlights the
     * same way the meshes do. Without a polygon offset on the meshes the factor is 0.
     * @param {number} factor Polygon offset factor of the meshes, 0 if they have none.
     */
    SetPolygonOffset (factor)
    {
        for (let threeMesh of this.rootObject.children) {
            threeMesh.material.polygonOffsetFactor = factor;
        }
    }
}
