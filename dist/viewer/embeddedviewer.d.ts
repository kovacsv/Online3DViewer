/**
 * Loads the model specified by urls.
 * @param {Element} parentElement The parent element for the viewer canvas.
 * @param {string[]} modelUrls Url list of model files.
 * @param {object} parameters See {@link EmbeddedViewer} constructor for details.
 * @returns {EmbeddedViewer}
 */
export function Init3DViewerElement(parentElement: Element, modelUrls: string[], parameters: object): EmbeddedViewer;
/**
 * Loads all the models on the page. This function looks for all the elements with online_3d_viewer
 * class name, and loads the model according to the tag's parameters.
 * @param {function} onReady Callback that called when all models are loaded. It has one parameter
 * that is an array of the created {@link EmbeddedViewer} objects.
 */
export function Init3DViewerElements(onReady: Function): void;
/**
 * This is the main object for embedding the viewer on a website.
 */
export class EmbeddedViewer {
    /**
     * @param {Element} parentElement The parent element for the viewer canvas. It must be an
     * existing DOM element and it will be the container for the canvas. The size of the viewer will
     * be automatically adjusted to the size of the parent element.
     * @param {object} parameters Parameters for embedding.
     * @param {Camera} [parameters.camera] Camera to use. If not specified, the default camera will
     * be used and the model will be fitted to the window.
     * @param {CameraMode} [parameters.cameraMode] Camera projection mode.
     * @param {RGBAColor} [parameters.backgroundColor] Background color of the canvas.
     * @param {RGBColor} [parameters.defaultColor] Default color of the model. It has effect only
     * if the imported model doesn't specify any color.
     * @param {EdgeSettings} [parameters.edgeSettings] Edge settings.
     * @param {EnvironmentSettings} [parameters.environmentSettings] Environment settings.
     * @param {function} [parameters.onModelLoaded] Callback that is called when the model with all
     * of the textures is fully loaded.
    */
    constructor(parentElement: Element, parameters: {
        camera?: Camera;
        cameraMode?: CameraMode;
        backgroundColor?: RGBAColor;
        defaultColor?: RGBColor;
        edgeSettings?: EdgeSettings;
        environmentSettings?: EnvironmentSettings;
        onModelLoaded?: Function;
    });
    parentElement: Element;
    parameters: {
        camera?: Camera;
        cameraMode?: CameraMode;
        backgroundColor?: RGBAColor;
        defaultColor?: RGBColor;
        edgeSettings?: EdgeSettings;
        environmentSettings?: EnvironmentSettings;
        onModelLoaded?: Function;
    };
    canvas: HTMLCanvasElement;
    viewer: Viewer;
    model: any;
    modelLoader: ThreeModelLoader;
    /**
     * Loads the model based on a list of urls. The list must contain the main model file and all
     * of the referenced files. For example in case of an obj file the list must contain the
     * corresponding mtl and texture files, too.
     * @param {string[]} modelUrls Url list of model files.
     */
    LoadModelFromUrlList(modelUrls: string[]): void;
    /**
     * Loads the model based on a list of {@link File} objects. The list must contain the main model
     * file and all of the referenced files. You must use this method when you are using a file picker
     * or drag and drop to select files from a computer.
     * @param {File[]} fileList File object list of model files.
     */
    LoadModelFromFileList(fileList: File[]): void;
    /**
     * Loads the model based on a list of {@link InputFile} objects. This method is used
     * internally, you should use LoadModelFromUrlList or LoadModelFromFileList instead.
     * @param {InputFile[]} inputFiles List of model files.
     */
    LoadModelFromInputFiles(inputFiles: InputFile[]): void;
    /**
     * Returns the underlying Viewer object.
     * @returns {Viewer}
     */
    GetViewer(): Viewer;
    /**
     * Returns the underlying Model object.
     * @returns {Model}
     */
    GetModel(): Model;
    /**
     * This method must be called when the size of the parent element changes to make sure that the
     * context has the same dimensions as the parent element.
     */
    Resize(): void;
    /**
     * Frees up all the memory that is allocated by the viewer. You should call this function if
     * yo don't need the viewer anymore.
     */
    Destroy(): void;
}
import { EnvironmentSettings } from "./shadingmodel.js";
import { Viewer } from "./viewer.js";
import { ThreeModelLoader } from "../threejs/threemodelloader.js";
//# sourceMappingURL=embeddedviewer.d.ts.map