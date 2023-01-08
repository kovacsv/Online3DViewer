export class MouseInteraction {
    prev: Coord2D;
    curr: Coord2D;
    diff: Coord2D;
    buttons: any[];
    Down(canvas: any, ev: any): void;
    Move(canvas: any, ev: any): void;
    Up(canvas: any, ev: any): void;
    Leave(canvas: any, ev: any): void;
    IsButtonDown(): boolean;
    GetButton(): any;
    GetPosition(): Coord2D;
    GetMoveDiff(): Coord2D;
    GetPositionFromEvent(canvas: any, ev: any): Coord2D;
}
export class TouchInteraction {
    prevPos: Coord2D;
    currPos: Coord2D;
    diffPos: Coord2D;
    prevDist: number;
    currDist: number;
    diffDist: number;
    fingers: number;
    Start(canvas: any, ev: any): void;
    Move(canvas: any, ev: any): void;
    End(canvas: any, ev: any): void;
    IsFingerDown(): boolean;
    GetFingerCount(): number;
    GetPosition(): Coord2D;
    GetMoveDiff(): Coord2D;
    GetDistanceDiff(): number;
    GetPositionFromEvent(canvas: any, ev: any): Coord2D;
    GetTouchDistanceFromEvent(canvas: any, ev: any): number;
}
export class ClickDetector {
    isClick: boolean;
    startPosition: any;
    Start(startPosition: any): void;
    Move(currentPosition: any): void;
    End(): void;
    Cancel(): void;
    IsClick(): boolean;
}
export namespace NavigationType {
    const None: number;
    const Orbit: number;
    const Pan: number;
    const Zoom: number;
}
export class Navigation {
    constructor(canvas: any, camera: any, callbacks: any);
    canvas: any;
    camera: any;
    callbacks: any;
    fixUpVector: boolean;
    mouse: MouseInteraction;
    touch: TouchInteraction;
    clickDetector: ClickDetector;
    onMouseClick: any;
    onMouseMove: any;
    onContext: any;
    SetMouseClickHandler(onMouseClick: any): void;
    SetMouseMoveHandler(onMouseMove: any): void;
    SetContextMenuHandler(onContext: any): void;
    IsFixUpVector(): boolean;
    SetFixUpVector(isFixUpVector: any): void;
    GetCamera(): any;
    SetCamera(camera: any): void;
    MoveCamera(newCamera: any, stepCount: any): void;
    GetFitToSphereCamera(center: any, radius: any): any;
    OnMouseDown(ev: any): void;
    OnMouseMove(ev: any): void;
    OnMouseUp(ev: any): void;
    OnMouseLeave(ev: any): void;
    OnTouchStart(ev: any): void;
    OnTouchMove(ev: any): void;
    OnTouchEnd(ev: any): void;
    OnMouseWheel(ev: any): void;
    OnContextMenu(ev: any): void;
    Orbit(angleX: any, angleY: any): void;
    Pan(moveX: any, moveY: any): void;
    Zoom(ratio: any): void;
    Update(): void;
    Click(button: any, mouseCoords: any): void;
    Context(clientX: any, clientY: any): void;
}
import { Coord2D } from "../geometry/coord2d.js";
//# sourceMappingURL=navigation.d.ts.map