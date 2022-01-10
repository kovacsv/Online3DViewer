import { Coord2D, CoordDistance2D, SubCoord2D } from '../geometry/coord2d.js';
import { CoordDistance3D, CoordIsEqual3D, CrossVector3D, SubCoord3D, VectorAngle3D } from '../geometry/coord3d.js';
import { DegRad, IsGreater, IsLower, IsZero } from '../geometry/geometry.js';
import { ParabolicTweenFunction, TweenCoord3D } from '../geometry/tween.js';
import { GetDomElementClientCoordinates } from './domutils.js';

export class Camera
{
    constructor (eye, center, up)
    {
        this.eye = eye;
        this.center = center;
        this.up = up;
    }

    Clone ()
    {
        return new Camera (
            this.eye.Clone (),
            this.center.Clone (),
            this.up.Clone ()
        );
    }
}

export function CameraIsEqual3D (a, b)
{
	return CoordIsEqual3D (a.eye, b.eye) && CoordIsEqual3D (a.center, b.center) && CoordIsEqual3D (a.up, b.up);
}

export class MouseInteraction
{
    constructor ()
    {
        this.prev = new Coord2D (0.0, 0.0);
        this.curr = new Coord2D (0.0, 0.0);
        this.diff = new Coord2D (0.0, 0.0);
        this.buttons = [];
    }

    Down (canvas, ev)
    {
        this.buttons.push (ev.which);
        this.curr = this.GetPositionFromEvent (canvas, ev);
        this.prev = this.curr.Clone ();
    }

    Move (canvas, ev)
    {
        this.curr = this.GetPositionFromEvent (canvas, ev);
		this.diff = SubCoord2D (this.curr, this.prev);
		this.prev = this.curr.Clone ();
	}

	Up (canvas, ev)
	{
		let buttonIndex = this.buttons.indexOf (ev.which);
		if (buttonIndex !== -1) {
			this.buttons.splice (buttonIndex, 1);
		}
		this.curr = this.GetPositionFromEvent (canvas, ev);
	}

	Leave (canvas, ev)
	{
		this.buttons = [];
		this.curr = this.GetPositionFromEvent (canvas, ev);
	}

	IsButtonDown ()
	{
		return this.buttons.length > 0;
	}

	GetButton ()
	{
		let length = this.buttons.length;
		if (length === 0) {
			return 0;
		}
		return this.buttons[length - 1];
	}

	GetPosition ()
	{
		return this.curr;
	}

	GetMoveDiff ()
	{
		return this.diff;
	}

	GetPositionFromEvent (canvas, ev)
	{
		return GetDomElementClientCoordinates (canvas, ev.clientX, ev.clientY);
	}
}

export class TouchInteraction
{
	constructor ()
	{
		this.prevPos = new Coord2D (0.0, 0.0);
		this.currPos = new Coord2D (0.0, 0.0);
		this.diffPos = new Coord2D (0.0, 0.0);
		this.prevDist = 0.0;
		this.currDist = 0.0;
		this.diffDist = 0.0;
		this.fingers = 0;
	}

	Start (canvas, ev)
	{
		if (ev.touches.length === 0) {
			return;
		}

		this.fingers = ev.touches.length;

		this.currPos = this.GetPositionFromEvent (canvas, ev);
		this.prevPos = this.currPos.Clone ();

		this.currDist = this.GetTouchDistanceFromEvent (canvas, ev);
		this.prevDist = this.currDist;
	}

	Move (canvas, ev)
	{
		if (ev.touches.length === 0) {
			return;
		}

		this.currPos = this.GetPositionFromEvent (canvas, ev);
		this.diffPos = SubCoord2D (this.currPos, this.prevPos);
		this.prevPos = this.currPos.Clone ();

		this.currDist = this.GetTouchDistanceFromEvent (canvas, ev);
		this.diffDist = this.currDist - this.prevDist;
		this.prevDist = this.currDist;
	}

	End (canvas, ev)
	{
		if (ev.touches.length === 0) {
			return;
		}

		this.fingers = 0;
		this.currPos = this.GetPositionFromEvent (canvas, ev);
		this.currDist = this.GetTouchDistanceFromEvent (canvas, ev);
	}

	IsFingerDown ()
	{
		return this.fingers !== 0;
	}

	GetFingerCount ()
	{
		return this.fingers;
	}

	GetPosition ()
	{
		return this.currPos;
	}

	GetMoveDiff ()
	{
		return this.diffPos;
	}

	GetDistanceDiff ()
	{
		return this.diffDist;
	}

	GetPositionFromEvent (canvas, ev)
	{
		let coord = null;
		if (ev.touches.length !== 0) {
			let touchEv = ev.touches[0];
			coord = GetDomElementClientCoordinates (canvas, touchEv.pageX, touchEv.pageY);
		}
		return coord;
	}

	GetTouchDistanceFromEvent (canvas, ev)
	{
		if (ev.touches.length !== 2) {
			return 0.0;
		}
		let touchEv1 = ev.touches[0];
		let touchEv2 = ev.touches[1];
		let distance = CoordDistance2D (
			GetDomElementClientCoordinates (canvas, touchEv1.pageX, touchEv1.pageY),
			GetDomElementClientCoordinates (canvas, touchEv2.pageX, touchEv2.pageY)
		);
		return distance;
	}
}

export class ClickDetector
{
	constructor ()
	{
		this.isClick = false;
		this.startPosition = null;
	}

	Start (startPosition)
	{
		this.isClick = true;
		this.startPosition = startPosition;
	}

	Move (currentPosition)
	{
		if (!this.isClick) {
			return;
		}

		if (this.startPosition !== null) {
			const maxClickDistance = 3.0;
			const currentDistance = CoordDistance2D (this.startPosition, currentPosition);
			if (currentDistance > maxClickDistance) {
				this.Cancel ();
			}
		} else {
			this.Cancel ();
		}
	}

	End ()
	{
		this.startPosition = null;
	}

	Cancel ()
	{
		this.isClick = false;
		this.startPosition = null;
	}

	IsClick ()
	{
		return this.isClick;
	}
}

export const NavigationType =
{
	None : 0,
	Orbit : 1,
	Pan : 2,
	Zoom : 3
};

export class Navigation
{
	constructor (canvas, camera, callbacks)
	{
		this.canvas = canvas;
		this.camera = camera;
		this.callbacks = callbacks;
		this.fixUpVector = true;

		this.mouse = new MouseInteraction ();
		this.touch = new TouchInteraction ();
		this.clickDetector = new ClickDetector ();

		this.onMouseClick = null;
		this.onMouseMove = null;
		this.onContext = null;

		if (this.canvas.addEventListener) {
			this.canvas.addEventListener ('mousedown', this.OnMouseDown.bind (this));
			this.canvas.addEventListener ('wheel', this.OnMouseWheel.bind (this));
			this.canvas.addEventListener ('touchstart', this.OnTouchStart.bind (this));
			this.canvas.addEventListener ('touchmove', this.OnTouchMove.bind (this));
			this.canvas.addEventListener ('touchcancel', this.OnTouchEnd.bind (this));
			this.canvas.addEventListener ('touchend', this.OnTouchEnd.bind (this));
			this.canvas.addEventListener ('contextmenu', this.OnContextMenu.bind (this));
		}
		if (document.addEventListener) {
			document.addEventListener ('mousemove', this.OnMouseMove.bind (this));
			document.addEventListener ('mouseup', this.OnMouseUp.bind (this));
			document.addEventListener ('mouseleave', this.OnMouseLeave.bind (this));
		}
	}

	SetMouseClickHandler (onMouseClick)
	{
		this.onMouseClick = onMouseClick;
	}

	SetMouseMoveHandler (onMouseMove)
	{
		this.onMouseMove = onMouseMove;
	}

	SetContextMenuHandler (onContext)
	{
		this.onContext = onContext;
	}

	IsFixUpVector ()
	{
		return this.fixUpVector;
	}

	SetFixUpVector (fixUpVector)
	{
		this.fixUpVector = fixUpVector;
	}

	GetCamera ()
	{
		return this.camera;
	}

	SetCamera (camera)
	{
		this.camera = camera;
	}

	MoveCamera (newCamera, stepCount)
	{
		function Step (obj, steps, count, index)
		{
			obj.camera.eye = steps.eye[index];
			obj.camera.center = steps.center[index];
			obj.camera.up = steps.up[index];
			obj.Update ();

			if (index < count - 1) {
				requestAnimationFrame (() => {
					Step (obj, steps, count, index + 1);
				});
			}
		}

		if (newCamera === null) {
			return;
		}

		if (stepCount === 0 || CameraIsEqual3D (this.camera, newCamera)) {
			this.camera = newCamera;
		} else {
			let tweenFunc = ParabolicTweenFunction;
			let steps = {
				eye : TweenCoord3D (this.camera.eye, newCamera.eye, stepCount, tweenFunc),
				center : TweenCoord3D (this.camera.center, newCamera.center, stepCount, tweenFunc),
				up : TweenCoord3D (this.camera.up, newCamera.up, stepCount, tweenFunc)
			};
			requestAnimationFrame (() => {
				Step (this, steps, stepCount, 0);
			});
		}

		this.Update ();
	}

	GetFitToSphereCamera (center, radius, fov)
	{
		if (IsZero (radius)) {
			return null;
		}

		let fitCamera = this.camera.Clone ();

		let offsetToOrigo = SubCoord3D (fitCamera.center, center);
		fitCamera.eye = SubCoord3D (fitCamera.eye, offsetToOrigo);
		fitCamera.center = center.Clone ();

		let centerEyeDirection = SubCoord3D (fitCamera.eye, fitCamera.center).Normalize ();
		let fieldOfView = fov / 2.0;
		if (this.canvas.width < this.canvas.height) {
			fieldOfView = fieldOfView * this.canvas.width / this.canvas.height;
		}
		let distance = radius / Math.sin (fieldOfView * DegRad);

		fitCamera.eye = fitCamera.center.Clone ().Offset (centerEyeDirection, distance);

		return fitCamera;
	}

	OnMouseDown (ev)
	{
		ev.preventDefault ();

		this.mouse.Down (this.canvas, ev);
		this.clickDetector.Start (this.mouse.GetPosition ());
	}

	OnMouseMove (ev)
	{
		this.mouse.Move (this.canvas, ev);
		this.clickDetector.Move (this.mouse.GetPosition ());
		if (this.onMouseMove) {
			let mouseCoords = GetDomElementClientCoordinates (this.canvas, ev.clientX, ev.clientY);
			this.onMouseMove (mouseCoords);
		}

		if (!this.mouse.IsButtonDown ()) {
			return;
		}

		let moveDiff = this.mouse.GetMoveDiff ();
		let mouseButton = this.mouse.GetButton ();

		let navigationType = NavigationType.None;
		if (mouseButton === 1) {
			if (ev.ctrlKey) {
				navigationType = NavigationType.Zoom;
			} else if (ev.shiftKey) {
				navigationType = NavigationType.Pan;
			} else {
				navigationType = NavigationType.Orbit;
			}
		} else if (mouseButton === 2 || mouseButton === 3) {
			navigationType = NavigationType.Pan;
		}

		if (navigationType === NavigationType.Orbit) {
			let orbitRatio = 0.5;
			this.Orbit (moveDiff.x * orbitRatio, moveDiff.y * orbitRatio);
		} else if (navigationType === NavigationType.Pan) {
			let eyeCenterDistance = CoordDistance3D (this.camera.eye, this.camera.center);
			let panRatio = 0.001 * eyeCenterDistance;
			this.Pan (moveDiff.x * panRatio, moveDiff.y * panRatio);
		} else if (navigationType === NavigationType.Zoom) {
			let zoomRatio = 0.005;
			this.Zoom (-moveDiff.y * zoomRatio);
		}

		this.Update ();
	}

	OnMouseUp (ev)
	{
		this.mouse.Up (this.canvas, ev);
		this.clickDetector.End ();

		if (this.clickDetector.IsClick ()) {
			let mouseCoords = this.mouse.GetPosition ();
			this.Click (ev.which, mouseCoords);
		}
	}

	OnMouseLeave (ev)
	{
		this.mouse.Leave (this.canvas, ev);
		this.clickDetector.Cancel ();
	}

	OnTouchStart (ev)
	{
		ev.preventDefault ();

		this.touch.Start (this.canvas, ev);
		this.clickDetector.Start (this.touch.GetPosition ());
	}

	OnTouchMove (ev)
	{
		ev.preventDefault ();

		this.touch.Move (this.canvas, ev);
		this.clickDetector.Move (this.touch.GetPosition ());
		if (!this.touch.IsFingerDown ()) {
			return;
		}

		let moveDiff = this.touch.GetMoveDiff ();
		let distanceDiff = this.touch.GetDistanceDiff ();
		let fingerCount = this.touch.GetFingerCount ();

		let navigationType = NavigationType.None;
		if (fingerCount === 1) {
			navigationType = NavigationType.Orbit;
		} else if (fingerCount === 2) {
			navigationType = NavigationType.Pan;
		}

		if (navigationType === NavigationType.Orbit) {
			let orbitRatio = 0.5;
			this.Orbit (moveDiff.x * orbitRatio, moveDiff.y * orbitRatio);
		} else if (navigationType === NavigationType.Pan) {
			let zoomRatio = 0.005;
			this.Zoom (distanceDiff * zoomRatio);
			let panRatio = 0.001 * CoordDistance3D (this.camera.eye, this.camera.center);
			this.Pan (moveDiff.x * panRatio, moveDiff.y * panRatio);
		}

		this.Update ();
	}

	OnTouchEnd (ev)
	{
		ev.preventDefault ();

		this.touch.End (this.canvas, ev);
		this.clickDetector.End ();

		if (this.clickDetector.IsClick ()) {
			let touchCoords = this.touch.GetPosition ();
			if (this.touch.GetFingerCount () === 1) {
				this.Click (1, touchCoords);
			}
		}
	}

	OnMouseWheel (ev)
	{
		ev.preventDefault ();

		let params = ev || window.event;

		let delta = -params.deltaY / 40;
		let ratio = 0.1;
		if (delta < 0) {
			ratio = ratio * -1.0;
		}

		this.Zoom (ratio);
		this.Update ();
	}

	OnContextMenu (ev)
	{
		ev.preventDefault ();

		if (this.clickDetector.IsClick ()) {
			this.Context (ev.clientX, ev.clientY);
			this.clickDetector.Cancel ();
		}
	}

	Orbit (angleX, angleY)
	{
		let radAngleX = angleX * DegRad;
		let radAngleY = angleY * DegRad;

		let viewDirection = SubCoord3D (this.camera.center, this.camera.eye).Normalize ();
		let horizontalDirection = CrossVector3D (viewDirection, this.camera.up).Normalize ();

		if (this.fixUpVector) {
			let originalAngle = VectorAngle3D (viewDirection, this.camera.up);
			let newAngle = originalAngle + radAngleY;
			if (IsGreater (newAngle, 0.0) && IsLower (newAngle, Math.PI)) {
				this.camera.eye.Rotate (horizontalDirection, -radAngleY, this.camera.center);
			}
			this.camera.eye.Rotate (this.camera.up, -radAngleX, this.camera.center);
		} else {
			let verticalDirection = CrossVector3D (horizontalDirection, viewDirection).Normalize ();
			this.camera.eye.Rotate (horizontalDirection, -radAngleY, this.camera.center);
			this.camera.eye.Rotate (verticalDirection, -radAngleX, this.camera.center);
			this.camera.up = verticalDirection;
		}
	}

	Pan (moveX, moveY)
	{
		let viewDirection = SubCoord3D (this.camera.center, this.camera.eye).Normalize ();
		let horizontalDirection = CrossVector3D (viewDirection, this.camera.up).Normalize ();
		let verticalDirection = CrossVector3D (horizontalDirection, viewDirection).Normalize ();

		this.camera.eye.Offset (horizontalDirection, -moveX);
		this.camera.center.Offset (horizontalDirection, -moveX);

		this.camera.eye.Offset (verticalDirection, moveY);
		this.camera.center.Offset (verticalDirection, moveY);
	}

	Zoom (ratio)
	{
		let direction = SubCoord3D (this.camera.center, this.camera.eye);
		let distance = direction.Length ();
		let move = distance * ratio;
		this.camera.eye.Offset (direction, move);
	}

	Update ()
	{
		this.callbacks.onUpdate ();
	}

	Click (button, mouseCoords)
	{
		if (this.onMouseClick) {
			this.onMouseClick (button, mouseCoords);
		}
	}

	Context (clientX, clientY)
	{
		if (this.onContext) {
			let globalCoords = {
				x : clientX,
				y : clientY
			};
			let localCoords = GetDomElementClientCoordinates (this.canvas, clientX, clientY);
			this.onContext (globalCoords, localCoords);
		}
	}
}
