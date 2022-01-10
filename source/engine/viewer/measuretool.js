import { BigEps, IsEqualEps } from '../geometry/geometry.js';

export class MeasureTool
{
    constructor ()
    {
        this.viewer = null;
        this.highlightColor = null;

        this.isActive = false;
        this.markers = [];
    }

    Init (viewer, highlightColor)
    {
        this.viewer = viewer;
        this.highlightColor = highlightColor;
    }

    IsActive ()
    {
        return this.isActive;
    }

    SetActive (isActive)
    {
        this.isActive = isActive;
        if (!this.isActive) {
            this.Clear ();
        }
    }

    Click (mouseCoordinates)
    {
        let intersection = this.viewer.GetMeshIntersectionUnderMouse (mouseCoordinates);
        if (intersection === null) {
            this.Clear ();
            return;
        }

        if (this.markers.length === 2) {
            this.Clear ();
        }

        this.AddMarker (intersection);
    }

    GetMarkerCount ()
    {
        return this.markers.length;
    }

    AddMarker (intersection)
    {
        this.markers.push (intersection);
        this.GenerateMarker (intersection);
    }

    Calculate ()
    {
        if (this.markers.length !== 2) {
            return null;
        }

        const a = this.markers[0];
        const b = this.markers[1];
        let result = {
            pointsDistance : null,
            parallelFacesDistance : null,
            facesAngle : null
        };

        const aNormal = this.GetFaceWorldNormal (a);
        const bNormal = this.GetFaceWorldNormal (b);
        result.pointsDistance = a.point.distanceTo (b.point);
        result.facesAngle = aNormal.angleTo (bNormal);
        if (IsEqualEps (result.facesAngle, 0.0, BigEps) || IsEqualEps (result.facesAngle, Math.PI, BigEps)) {
            let aPlane = new THREE.Plane ().setFromNormalAndCoplanarPoint (aNormal, a.point);
            result.parallelFacesDistance = Math.abs (aPlane.distanceToPoint (b.point));
        }
        return result;
    }

    Clear ()
    {
        this.viewer.ClearExtra ();
        this.markers = [];
    }

    GenerateMarker (intersection)
    {
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return true;
        });

        let coneHeight = boundingSphere.radius / 5.0;
        let coneRadius = coneHeight / 2.0;

        let coneGeometry = new THREE.ConeGeometry (coneRadius, coneHeight, 32);
        coneGeometry.translate (0.0, -coneHeight / 2.0, 0.0);
        coneGeometry.rotateX (-Math.PI / 2);

        let coneMaterial = this.viewer.CreateHighlightMaterial (this.highlightColor);
        coneMaterial.opacity = 0.6;
        coneMaterial.transparent = true;
        let cone = new THREE.Mesh (coneGeometry, coneMaterial);

        let faceNormal = this.GetFaceWorldNormal (intersection);
        cone.lookAt (faceNormal);
        cone.position.set (intersection.point.x, intersection.point.y, intersection.point.z);

        this.viewer.AddExtraObject (cone);
    }

    GetFaceWorldNormal (intersection)
    {
        let normalMatrix = new THREE.Matrix4 ();
        intersection.object.updateWorldMatrix (true, false);
        normalMatrix.extractRotation (intersection.object.matrixWorld);
        let faceNormal = intersection.face.normal.clone ();
        faceNormal.applyMatrix4 (normalMatrix);
        return faceNormal;
    }
}
