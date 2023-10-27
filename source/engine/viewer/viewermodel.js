import { RGBColor } from '../model/color.js';
import { ConvertColorToThreeColor, DisposeThreeObjects } from '../threejs/threeutils.js';

import * as THREE from 'three';

export function SetThreeMeshPolygonOffset (mesh, offset)
{
    function SetMaterialsPolygonOffset (materials, offset)
    {
        for (let material of materials) {
            material.polygonOffset = offset;
            material.polygonOffsetUnit = 1;
            material.polygonOffsetFactor = 1;
        }
    }

    SetMaterialsPolygonOffset (mesh.material, offset);
    if (mesh.userData.threeMaterials) {
        SetMaterialsPolygonOffset (mesh.userData.threeMaterials, offset);
    }
}

export class ViewerModel
{
    constructor (scene)
    {
        this.scene = scene;
        this.rootObject = null;
    }

    IsEmpty ()
    {
        return this.rootObject === null;
    }

    SetRootObject (rootObject)
    {
        if (this.rootObject !== null) {
            this.Clear ();
        }
        this.rootObject = rootObject;
        this.scene.add (this.rootObject);
    }

    GetRootObject ()
    {
        return this.rootObject;
    }

    AddObject (object)
    {
        if (this.rootObject === null) {
            let newRootObject = new THREE.Object3D ();
            this.SetRootObject (newRootObject);
        }
        this.rootObject.add (object);
    }

    Traverse (enumerator)
    {
        if (this.rootObject === null) {
            return;
        }
        this.rootObject.traverse ((obj) => {
            enumerator (obj);
        });
    }

    UpdateWorldMatrix ()
    {
        if (this.rootObject !== null) {
            this.rootObject.updateWorldMatrix (true, true);
        }
    }

    Clear ()
    {
        DisposeThreeObjects (this.rootObject);
        this.scene.remove (this.rootObject);
        this.rootObject = null;
    }
}

/**
 * Edge settings object.
 */
export class EdgeSettings
{
    /**
     * @param {boolean} showEdges Show edges.
     * @param {RGBColor} edgeColor Color of the edges.
     * @param {number} edgeThreshold Minimum angle between faces to show edges between them in.
     * The value must be in degrees.
     */
    constructor (showEdges, edgeColor, edgeThreshold)
    {
        this.showEdges = showEdges;
        this.edgeColor = edgeColor;
        this.edgeThreshold = edgeThreshold;
    }

    /**
     * Creates a clone of the object.
     * @returns {EdgeSettings}
     */
    Clone ()
    {
        return new EdgeSettings (this.showEdges, this.edgeColor.Clone (), this.edgeThreshold);
    }
}

export class ViewerMainModel
{
    constructor (scene)
    {
        this.scene = scene;

        this.mainModel = new ViewerModel (this.scene);
        this.edgeModel = new ViewerModel (this.scene);

        this.edgeSettings = new EdgeSettings (false, new RGBColor (0, 0, 0), 1);
        this.hasLines = false;
        this.hasPolygonOffset = false;
        this.fullBoundingBox = null;
    }

    SetMainObject (mainObject)
    {
        this.mainModel.SetRootObject (mainObject);
        this.hasLines = false;
        this.hasPolygonOffset = false;
        this.fullBoundingBox = null;

        this.EnumerateLines ((line) => {
            this.hasLines = true;
        });

        if (this.edgeSettings.showEdges) {
            this.GenerateEdgeModel ();
        }
        this.UpdatePolygonOffset ();
    }

    UpdateWorldMatrix ()
    {
        this.mainModel.UpdateWorldMatrix ();
        this.edgeModel.UpdateWorldMatrix ();
    }

    SetEdgeSettings (edgeSettings)
    {
        let needToGenerate = false;
        if (edgeSettings.showEdges && (!this.edgeSettings.showEdges || this.edgeSettings.edgeThreshold !== edgeSettings.edgeThreshold)) {
            needToGenerate = true;
        }

        this.edgeSettings = edgeSettings;

        if (this.mainModel.IsEmpty ()) {
            return;
        }

        if (this.edgeSettings.showEdges) {
            if (needToGenerate) {
                this.ClearEdgeModel ();
                this.GenerateEdgeModel ();
            } else {
                let edgeColor = ConvertColorToThreeColor (this.edgeSettings.edgeColor);
                this.EnumerateEdges ((edge) => {
                    edge.material.color = edgeColor;
                });
            }
        } else {
            this.ClearEdgeModel ();
        }
    }

    GenerateEdgeModel ()
    {
        let edgeColor = ConvertColorToThreeColor (this.edgeSettings.edgeColor);

        this.UpdateWorldMatrix ();
        this.EnumerateMeshes ((mesh) => {
            let edges = new THREE.EdgesGeometry (mesh.geometry, this.edgeSettings.edgeThreshold);
            let line = new THREE.LineSegments (edges, new THREE.LineBasicMaterial ({
                color: edgeColor
            }));
            line.applyMatrix4 (mesh.matrixWorld);
            line.userData = mesh.userData;
            line.visible = mesh.visible;
            this.edgeModel.AddObject (line);
        });

        this.UpdatePolygonOffset ();
    }

    GetFullBoundingBox ()
    {
        if (this.fullBoundingBox !== null) {
            return this.fullBoundingBox;
        }
        this.fullBoundingBox = this.GetBoundingBox (() => {
            return true;
        });
        return this.fullBoundingBox;
    }

    GetBoundingBox (needToProcess)
    {
        let hasMesh = false;
        let boundingBox = new THREE.Box3 ();
        this.EnumerateMeshesAndLines ((mesh) => {
            if (needToProcess (mesh.userData)) {
                boundingBox.union (new THREE.Box3 ().setFromObject (mesh));
                hasMesh = true;
            }
        });
        if (!hasMesh) {
            return null;
        }
        return boundingBox;
    }

    GetBoundingSphere (needToProcess)
    {
        let boundingBox = this.GetBoundingBox (needToProcess);
        if (boundingBox === null) {
            return null;
        }

        let boundingSphere = new THREE.Sphere ();
        boundingBox.getBoundingSphere (boundingSphere);
        return boundingSphere;
    }

    Clear ()
    {
        this.mainModel.Clear ();
        this.ClearEdgeModel ();
    }

    ClearEdgeModel ()
    {
        if (this.edgeModel.IsEmpty ()) {
            return;
        }

        this.UpdatePolygonOffset ();
        this.edgeModel.Clear ();
    }

    EnumerateMeshes (enumerator)
    {
        this.mainModel.Traverse ((obj) => {
            if (obj.isMesh) {
                enumerator (obj);
            }
        });
    }

    EnumerateLines (enumerator)
    {
        this.mainModel.Traverse ((obj) => {
            if (obj.isLineSegments) {
                enumerator (obj);
            }
        });
    }

    EnumerateMeshesAndLines (enumerator)
    {
        this.mainModel.Traverse ((obj) => {
            if (obj.isMesh) {
                enumerator (obj);
            } else if (obj.isLineSegments) {
                enumerator (obj);
            }
        });
    }

    EnumerateEdges (enumerator)
    {
        this.edgeModel.Traverse ((obj) => {
            if (obj.isLineSegments) {
                enumerator (obj);
            }
        });
    }

    HasLinesOrEdges ()
    {
        return this.hasLines || this.edgeSettings.showEdges;
    }

    UpdatePolygonOffset ()
    {
        let needPolygonOffset = this.HasLinesOrEdges ();
        if (needPolygonOffset !== this.hasPolygonOffset) {
            this.EnumerateMeshes ((mesh) => {
                SetThreeMeshPolygonOffset (mesh, needPolygonOffset);
            });
            this.hasPolygonOffset = needPolygonOffset;
        }
    }

    GetMeshIntersectionUnderMouse (mouseCoords, camera, width, height)
    {
        function CalculateLineThreshold (mousePos, camera, boundingBoxCenter)
        {
            let thresholdInScreenCoordinates = 15.0;
            let frustumRange = camera.far - camera.near;
            let cameraDistanceFromCenter = boundingBoxCenter.distanceTo (camera.position);
            let distanceInFrustumRatio = cameraDistanceFromCenter / frustumRange;
            let zValue = -1.0 + 2.0 * distanceInFrustumRatio;
            let referencePoint1 = new THREE.Vector3 (mousePos.x, mousePos.y, zValue).unproject (camera);
            let referencePoint2 = new THREE.Vector3 (mousePos.x + thresholdInScreenCoordinates, mousePos.y, zValue).unproject (camera);
            return referencePoint1.distanceTo (referencePoint2);
        }

        if (this.mainModel.IsEmpty ()) {
            return null;
        }

        if (mouseCoords.x < 0.0 || mouseCoords.x > width || mouseCoords.y < 0.0 || mouseCoords.y > height) {
            return null;
        }

        let mousePos = new THREE.Vector2 ();
        mousePos.x = (mouseCoords.x / width) * 2 - 1;
        mousePos.y = -(mouseCoords.y / height) * 2 + 1;

        let raycaster = new THREE.Raycaster ();
        if (this.hasLines) {
            let boundingBox = this.GetFullBoundingBox ();
            if (boundingBox !== null) {
                let boundingBoxCenter = new THREE.Vector3 (0.0, 0.0, 0.0);
                boundingBox.getCenter (boundingBoxCenter);
                raycaster.params.Line.threshold = CalculateLineThreshold (mousePos, camera, boundingBoxCenter);
            }
        }

        raycaster.setFromCamera (mousePos, camera);
        let iSectObjects = raycaster.intersectObject (this.mainModel.GetRootObject (), true);
        for (let i = 0; i < iSectObjects.length; i++) {
            let iSectObject = iSectObjects[i];
            if ((iSectObject.object.isMesh || iSectObject.object.isLineSegments) && iSectObject.object.visible) {
                return iSectObject;
            }
        }

        return null;
    }
}
