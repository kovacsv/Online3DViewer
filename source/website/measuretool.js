import { BigEps, IsEqualEps, RadDeg } from '../engine/geometry/geometry.js';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { AddSvgIconElement } from './utils.js';

function GetFaceWorldNormal (intersection)
{
    let normalMatrix = new THREE.Matrix4 ();
    intersection.object.updateWorldMatrix (true, false);
    normalMatrix.extractRotation (intersection.object.matrixWorld);
    let faceNormal = intersection.face.normal.clone ();
    faceNormal.applyMatrix4 (normalMatrix);
    return faceNormal;
}

function CreateMaterial (color)
{
    return new THREE.LineBasicMaterial ({
        color : color,
        depthTest : false
    });
}

function CreateLineFromPoints (points, material)
{
    let geometry = new THREE.BufferGeometry ().setFromPoints (points);
    return new THREE.Line (geometry, material);
}

class Marker
{
    constructor (intersection, color, radius)
    {
        this.intersection = null;
        this.markerObject = new THREE.Object3D ();

        let material = CreateMaterial (color);
        let circleCurve = new THREE.EllipseCurve (0.0, 0.0, radius, radius, 0.0, 2.0 * Math.PI, false, 0.0);
        this.markerObject.add (CreateLineFromPoints (circleCurve.getPoints (50), material));
        this.markerObject.add (CreateLineFromPoints ([new THREE.Vector3 (-radius, 0.0, 0.0), new THREE.Vector3 (radius, 0.0, 0.0)], material));
        this.markerObject.add (CreateLineFromPoints ([new THREE.Vector3 (0.0, -radius, 0.0), new THREE.Vector3 (0.0, radius, 0.0)], material));

        this.UpdatePosition (intersection);
    }

    UpdatePosition (intersection)
    {
        this.intersection = intersection;
        let faceNormal = GetFaceWorldNormal (this.intersection);
        this.markerObject.updateMatrixWorld (true);
        this.markerObject.position.set (0.0, 0.0, 0.0);
        this.markerObject.lookAt (faceNormal);
        this.markerObject.position.set (this.intersection.point.x, this.intersection.point.y, this.intersection.point.z);
    }

    Show (show)
    {
        this.markerObject.visible = show;
    }

    GetIntersection ()
    {
        return this.intersection;
    }

    GetObject ()
    {
        return this.markerObject;
    }
}

function CalculateMarkerValues (aMarker, bMarker)
{
    const aIntersection = aMarker.GetIntersection ();
    const bIntersection = bMarker.GetIntersection ();
    let result = {
        pointsDistance : null,
        parallelFacesDistance : null,
        facesAngle : null
    };

    const aNormal = GetFaceWorldNormal (aIntersection);
    const bNormal = GetFaceWorldNormal (bIntersection);
    result.pointsDistance = aIntersection.point.distanceTo (bIntersection.point);
    result.facesAngle = aNormal.angleTo (bNormal);
    if (IsEqualEps (result.facesAngle, 0.0, BigEps) || IsEqualEps (result.facesAngle, Math.PI, BigEps)) {
        let aPlane = new THREE.Plane ().setFromNormalAndCoplanarPoint (aNormal, aIntersection.point);
        result.parallelFacesDistance = Math.abs (aPlane.distanceToPoint (bIntersection.point));
    }
    return result;
}

export class MeasureTool
{
    constructor (viewer)
    {
        this.viewer = viewer;
        this.isActive = false;
        this.markers = [];
        this.tempMarker = null;

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

    MouseMove (mouseCoordinates)
    {
        let intersection = this.viewer.GetMeshIntersectionUnderMouse (mouseCoordinates);
        if (intersection === null) {
            if (this.tempMarker !== null) {
                this.tempMarker.Show (false);
                this.viewer.Render ();
            }
            return;
        }
        if (this.tempMarker === null) {
            this.tempMarker = this.GenerateMarker (intersection, 0x00cc00);
        }
        this.tempMarker.UpdatePosition (intersection);
        this.tempMarker.Show (true);
        this.viewer.Render ();
    }

    AddMarker (intersection)
    {
        let marker = this.GenerateMarker (intersection, 0xcc0000);
        this.markers.push (marker);
        if (this.markers.length === 2) {
            let material = CreateMaterial (0x0000cc);
            let aPoint = this.markers[0].GetIntersection ().point;
            let bPoint = this.markers[1].GetIntersection ().point;
            this.viewer.AddExtraObject (CreateLineFromPoints ([aPoint, bPoint], material));
        }
    }

    GenerateMarker (intersection, color)
    {
        let boundingSphere = this.viewer.GetBoundingSphere ((meshUserData) => {
            return true;
        });

        let radius = boundingSphere.radius / 20.0;
        let marker = new Marker (intersection, color, radius);
        this.viewer.AddExtraObject (marker.GetObject ());
        return marker;
    }

    UpdatePanel ()
    {
        function AddValue (panel, icon, title, value)
        {
            const precision = 5;
            let svgIcon = AddSvgIconElement (panel, icon, 'left_inline');
            svgIcon.title = title;
            AddDiv (panel, 'ov_measure_value', value.toFixed (precision));
        }

        ClearDomElement (this.panel);
        if (this.markers.length === 0) {
            this.panel.innerHTML = 'Select a point.';
        } else if (this.markers.length === 1) {
            this.panel.innerHTML = 'Select another point.';
        } else {
            let calcResult = CalculateMarkerValues (this.markers[0], this.markers[1]);

            if (calcResult.pointsDistance !== null) {
                AddValue (this.panel, 'measure', 'Distance of points', calcResult.pointsDistance);
            }
            if (calcResult.parallelFacesDistance !== null) {
                AddValue (this.panel, 'measure', 'Distance of parallel faces', calcResult.parallelFacesDistance);
            }
            if (calcResult.facesAngle !== null) {
                let degreeValue = calcResult.facesAngle * RadDeg;
                AddValue (this.panel, 'measure', 'Angle of faces', degreeValue);
            }
        }
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
        this.panel.style.width = (rect.right - rect.left) + 'px';
    }

    ClearMarkers ()
    {
        this.viewer.ClearExtra ();
        this.markers = [];
        this.tempMarker = null;
    }
}
