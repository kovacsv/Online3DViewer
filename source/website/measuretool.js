import { BigEps, IsEqualEps } from '../engine/geometry/geometry.js';
import { AddDiv } from '../engine/viewer/domutils.js';

export class MeasureTool
{
    constructor (viewer)
    {
        this.viewer = viewer;
        this.isActive = false;
        this.markers = [];

        this.panel = null;
        this.button = null;
    }

    SetButton (button)
    {
        this.button = button;
    }

    IsActive ()
    {
        return this.isActive;
    }

    SetActive (isActive)
    {
        if (this.isActive === isActive) {
            return;
        }
        this.isActive = isActive;
        this.button.SetSelected (isActive);
        if (this.isActive) {
            this.panel = AddDiv (document.body, 'ov_measure_panel', 'hejj');
            this.UpdatePanel ();
            this.Resize ();
        } else {
            this.ClearMarkers ();
            this.panel.remove ();
        }
    }

    Click (mouseCoordinates)
    {
        let intersection = this.viewer.GetMeshIntersectionUnderMouse (mouseCoordinates);
        if (intersection === null) {
            this.ClearMarkers ();
            this.UpdatePanel ();
            return;
        }

        if (this.markers.length === 2) {
            this.ClearMarkers ();
        }

        this.AddMarker (intersection);
        this.UpdatePanel ();
    }

    AddMarker (intersection)
    {
        this.markers.push (intersection);
        this.GenerateMarker (intersection);
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

        let coneMaterial = this.viewer.CreateHighlightMaterial (0xcc0000);
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

    UpdatePanel ()
    {
        if (this.markers.length === 0) {
            this.panel.innerHTML = 'Select a point to start measuring.';
        } else if (this.markers.length === 1) {
            this.panel.innerHTML = 'Select another point to start measuring.';
        } else {
            let calcResult = this.Calculate ();
            this.panel.innerHTML = JSON.stringify (calcResult);
        }
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

    Resize ()
    {
        if (!this.isActive) {
            return;
        }
        let canvas = this.viewer.GetCanvas ();
        let rect = canvas.getBoundingClientRect ();
        this.panel.style.left = rect.left + 'px';
        this.panel.style.top = rect.top + 'px';
    }

    ClearMarkers ()
    {
        this.viewer.ClearExtra ();
        this.markers = [];
    }
}
