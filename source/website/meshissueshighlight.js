import * as THREE from 'three';

const BoundaryEdgeColor = 0xff0000;
const NonManifoldEdgeColor = 0xff00ff;

function CreateLineSegments (edgePositions, color)
{
    let geometry = new THREE.BufferGeometry ();
    geometry.setAttribute ('position', new THREE.BufferAttribute (edgePositions, 3));
    // Without depth test the edges stay visible on top of the surface they lie on.
    let material = new THREE.LineBasicMaterial ({
        color : color,
        depthTest : false
    });
    let lineSegments = new THREE.LineSegments (geometry, material);
    lineSegments.renderOrder = 1;
    return lineSegments;
}

export class MeshIssuesHighlight
{
    constructor (viewer)
    {
        this.viewer = viewer;
        this.object = null;
    }

    Show (meshCheckResult)
    {
        this.Clear ();
        this.object = new THREE.Object3D ();
        if (meshCheckResult.boundaryEdgePositions.length > 0) {
            this.object.add (CreateLineSegments (meshCheckResult.boundaryEdgePositions, BoundaryEdgeColor));
        }
        if (meshCheckResult.nonManifoldEdgePositions.length > 0) {
            this.object.add (CreateLineSegments (meshCheckResult.nonManifoldEdgePositions, NonManifoldEdgeColor));
        }
        this.viewer.AddExtraObject (this.object);
    }

    Clear ()
    {
        if (this.object === null) {
            return;
        }
        this.viewer.RemoveExtraObject (this.object);
        this.object = null;
    }
}
