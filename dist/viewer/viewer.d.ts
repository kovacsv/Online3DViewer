export function GetDefaultCamera(direction: any): Camera;
export function TraverseThreeObject(object: any, processor: any): boolean;
export function GetShadingTypeOfObject(mainObject: any): any;
export class CameraValidator {
    eyeCenterDistance: number;
    forceUpdate: boolean;
    ForceUpdate(): void;
    ValidatePerspective(): boolean;
    ValidateOrthographic(eyeCenterDistance: any): boolean;
}
export class UpVector {
    direction: number;
    isFixed: boolean;
    isFlipped: boolean;
    SetDirection(newDirection: any, oldCamera: any): any;
    SetFixed(isFixed: any, oldCamera: any): any;
    Flip(oldCamera: any): any;
}
export class Viewer {
    canvas: any;
    renderer: any;
    scene: any;
    mainModel: ViewerMainModel;
    extraModel: ViewerModel;
    camera: any;
    cameraMode: any;
    cameraValidator: CameraValidator;
    shadingModel: ShadingModel;
    navigation: Navigation;
    upVector: UpVector;
    settings: {
        animationSteps: number;
    };
    Init(canvas: any): void;
    SetMouseClickHandler(onMouseClick: any): void;
    SetMouseMoveHandler(onMouseMove: any): void;
    SetContextMenuHandler(onContext: any): void;
    SetEdgeSettings(edgeSettings: any): void;
    SetEnvironmentMapSettings(environmentSettings: any): void;
    SetBackgroundColor(color: any): void;
    GetCanvas(): any;
    GetCamera(): any;
    GetCameraMode(): any;
    SetCamera(camera: any): void;
    SetCameraMode(cameraMode: any): void;
    Resize(width: any, height: any): void;
    ResizeRenderer(width: any, height: any): void;
    FitSphereToWindow(boundingSphere: any, animation: any): void;
    AdjustClippingPlanes(): void;
    AdjustClippingPlanesToSphere(boundingSphere: any): void;
    IsFixUpVector(): boolean;
    SetFixUpVector(isFixUpVector: any): void;
    SetUpVector(upDirection: any, animate: any): void;
    FlipUpVector(): void;
    Render(): void;
    SetMainObject(object: any): void;
    AddExtraObject(object: any): void;
    Clear(): void;
    ClearExtra(): void;
    SetMeshesVisibility(isVisible: any): void;
    SetMeshesHighlight(highlightColor: any, isHighlighted: any): void;
    CreateHighlightMaterial(highlightColor: any): any;
    GetMeshUserDataUnderMouse(mouseCoords: any): any;
    GetMeshIntersectionUnderMouse(mouseCoords: any): any;
    GetBoundingBox(needToProcess: any): any;
    GetBoundingSphere(needToProcess: any): any;
    EnumerateMeshesUserData(enumerator: any): void;
    InitNavigation(): void;
    InitShading(): void;
    GetShadingType(): number;
    GetImageSize(): {
        width: number;
        height: number;
    };
    GetCanvasSize(): {
        width: any;
        height: any;
    };
    GetImageAsDataUrl(width: any, height: any): any;
    Destroy(): void;
}
import { Camera } from "./camera.js";
import { ViewerMainModel } from "./viewermodel.js";
import { ViewerModel } from "./viewermodel.js";
import { ShadingModel } from "./shadingmodel.js";
import { Navigation } from "./navigation.js";
//# sourceMappingURL=viewer.d.ts.map