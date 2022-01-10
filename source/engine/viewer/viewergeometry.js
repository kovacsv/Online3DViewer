import { IsEqual } from '../geometry/geometry.js';
import { Color } from '../model/color.js';
import { ConvertColorToThreeColor } from '../threejs/threeutils.js';

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

export class ViewerGeometry
{
    constructor (scene)
    {
        this.scene = scene;

        this.mainObject = null;
        this.mainGridObject = null;
        this.mainEdgeObject = null;

        this.gridSettings = {
            showGrid : false
        };
        this.edgeSettings = {
            showEdges : false,
            edgeColor : new Color (0, 0, 0),
            edgeThreshold : 1
        };
    }

    SetMainObject (mainObject)
    {
        this.mainObject = mainObject;
        this.scene.add (this.mainObject);

        if (this.gridSettings.showGrid) {
            this.GenerateMainGridObject ();
        }
        if (this.edgeSettings.showEdges) {
            this.GenerateMainEdgeObject ();
        }
    }

    UpdateWorldMatrix ()
    {
        if (this.mainObject !== null) {
            this.mainObject.updateWorldMatrix (true, true);
        }
    }

    SetGridSettings (show)
    {
        this.gridSettings.showGrid = show;
        if (this.mainObject === null) {
            return;
        }

        if (this.gridSettings.showGrid) {
            this.ClearMainGridObject ();
            this.GenerateMainGridObject ();
        } else {
            this.ClearMainGridObject ();
        }
    }

    SetEdgeSettings (show, color, threshold)
    {
        let needToGenerate = false;
        if (show && (!this.edgeSettings.showEdges || this.edgeSettings.edgeThreshold !== threshold)) {
            needToGenerate = true;
        }

        this.edgeSettings.showEdges = show;
        this.edgeSettings.edgeThreshold = threshold;
        this.edgeSettings.edgeColor = color;

        if (this.mainObject === null) {
            return;
        }

        if (this.edgeSettings.showEdges) {
            if (needToGenerate) {
                this.ClearMainEdgeObject ();
                this.GenerateMainEdgeObject ();
            } else {

                let edgeColor = ConvertColorToThreeColor (this.edgeSettings.edgeColor);
                this.EnumerateEdges ((edge) => {
                    edge.material.color = edgeColor;
                });
            }
        } else {
            this.ClearMainEdgeObject ();
        }
    }

    GenerateMainGridObject ()
    {
        function CreateLine (from, to, material)
        {
            let points = [from, to];
            let geometry = new THREE.BufferGeometry ().setFromPoints (points);
            let line = new THREE.Line (geometry, material);
            return line;
        }

        this.UpdateWorldMatrix ();
        let boundingBox = this.GetBoundingBox ((meshUserData) => {
            return true;
        });
        if (boundingBox === null) {
            return;
        }

        this.mainGridObject = new THREE.Object3D ();
        const strongMaterial = new THREE.LineBasicMaterial ({ color: 0x888888 });
        const lightMaterial = new THREE.LineBasicMaterial ({ color: 0xdddddd });

        // TODO: direction handling
        let boundingBoxSize = new THREE.Vector3 ();
        boundingBox.getSize (boundingBoxSize);
        let expandSize = 1.0;

        let minValue = new THREE.Vector2 (boundingBox.min.z - expandSize, boundingBox.min.x - expandSize);
        let maxValue = new THREE.Vector2 (boundingBox.max.z + expandSize, boundingBox.max.x + expandSize);

        let cellSize = 1.0;
        let alignedMinValue = new THREE.Vector2 (
            Math.floor (minValue.x / cellSize) * cellSize,
            Math.floor (minValue.y / cellSize) * cellSize
        );
        let alignedMaxValue = new THREE.Vector2 (
            Math.ceil (maxValue.x / cellSize) * cellSize,
            Math.ceil (maxValue.y / cellSize) * cellSize
        );

        let level = boundingBox.min.y;
        let cellCountX = Math.floor ((alignedMaxValue.x - alignedMinValue.x) / cellSize);
        let cellCountY = Math.floor ((alignedMaxValue.y - alignedMinValue.y) / cellSize);
        for (let step = 0; step < cellCountX + 1; step++) {
            let lineDist = alignedMinValue.x + step * cellSize;
            let beg = new THREE.Vector3 (alignedMinValue.y, level, lineDist);
            let end = new THREE.Vector3 (alignedMaxValue.y, level, lineDist);
            let material = IsEqual (lineDist, 0.0) ? strongMaterial : lightMaterial;
            this.mainGridObject.add (CreateLine (beg, end, material));
        }
        for (let step = 0; step < cellCountY + 1; step++) {
            let lineDist = alignedMinValue.y + step * cellSize;
            let beg = new THREE.Vector3 (lineDist, level, alignedMinValue.x);
            let end = new THREE.Vector3 (lineDist, level, alignedMaxValue.x);
            let material = IsEqual (lineDist, 0.0) ? strongMaterial : lightMaterial;
            this.mainGridObject.add (CreateLine (beg, end, material));
        }
        this.scene.add (this.mainGridObject);

    }

    GenerateMainEdgeObject ()
    {
        let edgeColor = ConvertColorToThreeColor (this.edgeSettings.edgeColor);
        this.mainEdgeObject = new THREE.Object3D ();

        this.UpdateWorldMatrix ();
        this.EnumerateMeshes ((mesh) => {
            SetThreeMeshPolygonOffset (mesh, true);
            let edges = new THREE.EdgesGeometry (mesh.geometry, this.edgeSettings.edgeThreshold);
            let line = new THREE.LineSegments (edges, new THREE.LineBasicMaterial ({
                color: edgeColor
            }));
            line.applyMatrix4 (mesh.matrixWorld);
            line.userData = mesh.userData;
            line.visible = mesh.visible;
            this.mainEdgeObject.add (line);
        });
        this.scene.add (this.mainEdgeObject);
    }

    GetBoundingBox (needToProcess)
    {
        let hasMesh = false;
        let boundingBox = new THREE.Box3 ();
        this.EnumerateMeshes ((mesh) => {
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
        this.ClearMainObject ();
        this.ClearMainGridObject ();
        this.ClearMainEdgeObject ();
    }

    ClearMainObject ()
    {
        if (this.mainObject === null) {
            return;
        }

        this.EnumerateMeshes ((mesh) => {
            mesh.geometry.dispose ();
        });
        this.scene.remove (this.mainObject);
        this.mainObject = null;
    }

    ClearMainGridObject ()
    {
        if (this.mainGridObject === null) {
            return;
        }

        this.mainGridObject.traverse ((obj) => {
            if (obj.isLineSegments) {
                obj.geometry.dispose ();
            }
        });
        this.scene.remove (this.mainGridObject);
        this.mainGridObject = null;
    }

    ClearMainEdgeObject ()
    {
        if (this.mainEdgeObject === null) {
            return;
        }

        this.EnumerateMeshes ((mesh) => {
            SetThreeMeshPolygonOffset (mesh, false);
        });
        this.EnumerateEdges ((edge) => {
            edge.geometry.dispose ();
        });
        this.scene.remove (this.mainEdgeObject);
        this.mainEdgeObject = null;
    }

    EnumerateMeshes (enumerator)
    {
        if (this.mainObject === null) {
            return;
        }
        this.mainObject.traverse ((obj) => {
            if (obj.isMesh) {
                enumerator (obj);
            }
        });
    }

    EnumerateEdges (enumerator)
    {
        if (this.mainEdgeObject === null) {
            return;
        }
        this.mainEdgeObject.traverse ((obj) => {
            if (obj.isLineSegments) {
                enumerator (obj);
            }
        });
    }

    GetMeshIntersectionUnderMouse (mouseCoords, camera, width, height)
    {
        if (this.mainObject === null) {
            return null;
        }

        let raycaster = new THREE.Raycaster ();
        let mousePos = new THREE.Vector2 ();
        mousePos.x = (mouseCoords.x / width) * 2 - 1;
        mousePos.y = -(mouseCoords.y / height) * 2 + 1;
        raycaster.setFromCamera (mousePos, camera);
        let iSectObjects = raycaster.intersectObject (this.mainObject, true);
        for (let i = 0; i < iSectObjects.length; i++) {
            let iSectObject = iSectObjects[i];
            if (iSectObject.object.type === 'Mesh' && iSectObject.object.visible) {
                return iSectObject;
            }
        }

        return null;
    }
}

export class ViewerExtraGeometry
{
    constructor (scene)
    {
        this.scene = scene;
        this.mainObject = null;
    }

    AddObject (object)
    {
        if (this.mainObject === null) {
            this.mainObject = new THREE.Object3D ();
            this.scene.add (this.mainObject);
        }
        this.mainObject.add (object);
    }

    Clear ()
    {
        if (this.mainObject === null) {
            return;
        }
        this.mainObject.traverse ((obj) => {
            if (obj.isMesh || obj.isLineSegments) {
                obj.geometry.dispose ();
            }
        });
        this.scene.remove (this.mainObject);
        this.mainObject = null;
    }
}
