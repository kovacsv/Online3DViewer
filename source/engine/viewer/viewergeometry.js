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
        this.mainEdgeObject = null;

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
