export function SetThreeMeshPolygonOffset(mesh: any, offset: any): void;
export class ViewerModel {
    constructor(scene: any);
    scene: any;
    rootObject: any;
    IsEmpty(): boolean;
    SetRootObject(rootObject: any): void;
    GetRootObject(): any;
    AddObject(object: any): void;
    Traverse(enumerator: any): void;
    UpdateWorldMatrix(): void;
    Clear(): void;
}
/**
 * Edge settings object.
 */
export class EdgeSettings {
    /**
     * @param {boolean} showEdges Show edges.
     * @param {RGBColor} edgeColor Color of the edges.
     * @param {number} edgeThreshold Minimum angle between faces to show edges between them in.
     * The value must be in degrees.
     */
    constructor(showEdges: boolean, edgeColor: RGBColor, edgeThreshold: number);
    showEdges: boolean;
    edgeColor: RGBColor;
    edgeThreshold: number;
    /**
     * Creates a clone of the object.
     * @returns {EdgeSettings}
     */
    Clone(): EdgeSettings;
}
export class ViewerMainModel {
    constructor(scene: any);
    scene: any;
    mainModel: ViewerModel;
    edgeModel: ViewerModel;
    edgeSettings: EdgeSettings;
    SetMainObject(mainObject: any): void;
    UpdateWorldMatrix(): void;
    SetEdgeSettings(edgeSettings: any): void;
    GenerateEdgeModel(): void;
    GetBoundingBox(needToProcess: any): any;
    GetBoundingSphere(needToProcess: any): any;
    Clear(): void;
    ClearEdgeModel(): void;
    EnumerateMeshes(enumerator: any): void;
    EnumerateEdges(enumerator: any): void;
    GetMeshIntersectionUnderMouse(mouseCoords: any, camera: any, width: any, height: any): any;
}
import { RGBColor } from "../model/color.js";
//# sourceMappingURL=viewermodel.d.ts.map