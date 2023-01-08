export function ConvertModelToThreeObject(model: any, params: any, output: any, callbacks: any): void;
export class ModelToThreeConversionParams {
    forceMediumpForMaterials: boolean;
}
export class ModelToThreeConversionOutput {
    defaultMaterial: any;
    objectUrls: any[];
}
export class ThreeConversionStateHandler {
    constructor(callbacks: any);
    callbacks: any;
    texturesNeeded: number;
    texturesLoaded: number;
    threeObject: any;
    OnTextureNeeded(): void;
    OnTextureLoaded(): void;
    OnModelLoaded(threeObject: any): void;
    Finish(): void;
}
export class ThreeNodeTree {
    constructor(rootNode: any, threeRootNode: any);
    meshInstances: any[];
    AddNode(node: any, threeNode: any): void;
    GetMeshInstances(): any[];
}
//# sourceMappingURL=threeconverter.d.ts.map