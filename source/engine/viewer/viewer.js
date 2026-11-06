import { Coord3D, CoordDistance3D, SubCoord3D } from '../geometry/coord3d.js';
import { DegRad, Direction, IsEqual } from '../geometry/geometry.js';
import { ColorComponentToFloat } from '../model/color.js';
import { CreateHighlightMaterials, ShadingType } from '../threejs/threeutils.js';
import { Camera, NavigationMode, ProjectionMode } from './camera.js';
import { GetDomElementInnerDimensions } from './domutils.js';
import { Navigation } from './navigation.js';
import { ShadingModel } from './shadingmodel.js';
import { ViewerModel, ViewerMainModel } from './viewermodel.js';
import { ViewerEdgeHighlight } from './vieweredgehighlight.js';
import { ViewerSurfaceStrain } from './viewersurfacestrain.js';

import * as THREE from 'three';

export function GetDefaultCamera (direction)
{
    let fieldOfView = 45.0;
    if (direction === Direction.X) {
        return new Camera (
            new Coord3D (3.0, 3.0, 3.0),
            new Coord3D (0.0, 0.0, 0.0),
            new Coord3D (1.0, 0.0, 0.0),
            fieldOfView
        );
    } else if (direction === Direction.Y) {
        return new Camera (
            new Coord3D (3.0, 3.0, 3.0),
            new Coord3D (0.0, 0.0, 0.0),
            new Coord3D (0.0, 1.0, 0.0),
            fieldOfView
        );
    } else if (direction === Direction.Z) {
        return new Camera (
            new Coord3D (3.0, 3.0, 3.0),
            new Coord3D (0.0, 0.0, 0.0),
            new Coord3D (0.0, 0.0, 1.0),
            fieldOfView
        );
    }
    return null;
}

export function TraverseThreeObject (object, processor)
{
    if (!processor (object)) {
        return false;
    }
    for (let child of object.children) {
        if (!TraverseThreeObject (child, processor)) {
            return false;
        }
    }
    return true;
}

function SetMaterialOpacity (material, transparent, opacity, depthWrite)
{
    if (material.transparent !== transparent) {
        // It changes the compiled shader.
        material.needsUpdate = true;
    }
    material.transparent = transparent;
    material.opacity = opacity;
    material.depthWrite = depthWrite;
}

export function GetShadingTypeOfObject (mainObject)
{
    let shadingType = null;
    TraverseThreeObject (mainObject, (obj) => {
        if (obj.isMesh) {
            for (const material of obj.material) {
                if (material.type === 'MeshPhongMaterial') {
                    shadingType = ShadingType.Phong;
                } else if (material.type === 'MeshStandardMaterial') {
                    shadingType = ShadingType.Physical;
                }
                return false;
            }
        }
        return true;
    });
    return shadingType;
}

export class CameraValidator
{
    constructor ()
    {
        this.eyeCenterDistance = 0.0;
        this.forceUpdate = true;
    }

    ForceUpdate ()
    {
        this.forceUpdate = true;
    }

    ValidatePerspective ()
    {
        if (this.forceUpdate) {
            this.forceUpdate = false;
            return false;
        }
        return true;
    }

    ValidateOrthographic (eyeCenterDistance)
    {
        if (this.forceUpdate || !IsEqual (this.eyeCenterDistance, eyeCenterDistance)) {
            this.eyeCenterDistance = eyeCenterDistance;
            this.forceUpdate = false;
            return false;
        }
        return true;
    }
}

export class UpVector
{
    constructor ()
    {
        this.direction = Direction.Y;
        this.isFixed = true;
        this.isFlipped = false;
    }

    SetDirection (newDirection, oldCamera)
    {
        this.direction = newDirection;
        this.isFlipped = false;

        let defaultCamera = GetDefaultCamera (this.direction);
        let defaultDir = SubCoord3D (defaultCamera.eye, defaultCamera.center);

        let distance = CoordDistance3D (oldCamera.center, oldCamera.eye);
        let newEye = oldCamera.center.Clone ().Offset (defaultDir, distance);

        let newCamera = oldCamera.Clone ();
        if (this.direction === Direction.X) {
            newCamera.up = new Coord3D (1.0, 0.0, 0.0);
            newCamera.eye = newEye;
        } else if (this.direction === Direction.Y) {
            newCamera.up = new Coord3D (0.0, 1.0, 0.0);
            newCamera.eye = newEye;
        } else if (this.direction === Direction.Z) {
            newCamera.up = new Coord3D (0.0, 0.0, 1.0);
            newCamera.eye = newEye;
        }
        return newCamera;
    }

    SetFixed (isFixed, oldCamera)
    {
        this.isFixed = isFixed;
        if (this.isFixed) {
            return this.SetDirection (this.direction, oldCamera);
        }
        return null;
    }

    Flip (oldCamera)
    {
        this.isFlipped = !this.isFlipped;
        let newCamera = oldCamera.Clone ();
        newCamera.up.MultiplyScalar (-1.0);
        return newCamera;
    }
}

export class Viewer
{
    constructor ()
    {
        THREE.ColorManagement.enabled = false;

        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.mainModel = null;
        this.extraModel = null;
        this.surfaceStrainModel = null;
        this.surfaceStrain = null;
        this.edgeHighlightModel = null;
        this.edgeHighlight = null;
        this.camera = null;
        this.projectionMode = null;
        this.cameraValidator = null;
        this.shadingModel = null;
        this.navigation = null;
        this.upVector = null;
        this.modelOpacity = 1.0;
        // Original transparent, opacity and depthWrite of the materials faded by modelOpacity.
        this.modelOpacityOriginals = new WeakMap ();
        this.settings = {
            animationSteps : 40
        };
    }

    Init (canvas)
    {
        this.canvas = canvas;
        this.canvas.id = 'viewer';

        let parameters = {
            canvas : this.canvas,
            antialias : true
        };

        this.renderer = new THREE.WebGLRenderer (parameters);
        this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

        if (window.devicePixelRatio) {
            this.renderer.setPixelRatio (window.devicePixelRatio);
        }
        this.renderer.setClearColor ('#ffffff', 1.0);
        this.renderer.setSize (this.canvas.width, this.canvas.height);

        this.scene = new THREE.Scene ();
        this.mainModel = new ViewerMainModel (this.scene);
        this.extraModel = new ViewerModel (this.scene);
        this.surfaceStrainModel = new ViewerModel (this.scene);
        this.edgeHighlightModel = new ViewerModel (this.scene);

        this.InitNavigation ();
        this.InitShading ();

        this.Render ();
    }

    SetMouseClickHandler (onMouseClick)
    {
        this.navigation.SetMouseClickHandler (onMouseClick);
    }

    SetMouseMoveHandler (onMouseMove)
    {
        this.navigation.SetMouseMoveHandler (onMouseMove);
    }

    SetContextMenuHandler (onContext)
    {
        this.navigation.SetContextMenuHandler (onContext);
    }

    SetEdgeSettings (edgeSettings)
    {
        let newEdgeSettings = edgeSettings.Clone ();
        this.mainModel.SetEdgeSettings (newEdgeSettings);
        // Generated edges copy the visibility of their mesh, which the surface strain overlay may
        // have hidden, so apply the visibility again.
        this.UpdateMeshesVisibility ();
        this.Render ();
    }

    SetEnvironmentMapSettings (environmentSettings)
    {
        let newEnvironmentSettings = environmentSettings.Clone ();
        this.shadingModel.SetEnvironmentMapSettings (newEnvironmentSettings, () => {
            this.Render ();
        });
        this.shadingModel.UpdateShading ();
        this.Render ();
    }

    SetBackgroundColor (color)
    {
        let bgColor = new THREE.Color (
            ColorComponentToFloat (color.r),
            ColorComponentToFloat (color.g),
            ColorComponentToFloat (color.b)
        );
        let alpha = ColorComponentToFloat (color.a);
        this.renderer.setClearColor (bgColor, alpha);
        this.Render ();
    }

    GetCanvas ()
    {
        return this.canvas;
    }

    GetCamera ()
    {
        return this.navigation.GetCamera ();
    }

    GetProjectionMode ()
    {
        return this.projectionMode;
    }

    SetCamera (camera)
    {
        this.navigation.SetCamera (camera);
        this.cameraValidator.ForceUpdate ();
        this.Render ();
    }

    SetProjectionMode (projectionMode)
    {
        if (this.projectionMode === projectionMode) {
            return;
        }

        this.scene.remove (this.camera);
        if (projectionMode === ProjectionMode.Perspective) {
            this.camera = new THREE.PerspectiveCamera (45.0, 1.0, 0.1, 1000.0);
        } else if (projectionMode === ProjectionMode.Orthographic) {
			this.camera = new THREE.OrthographicCamera (-1.0, 1.0, 1.0, -1.0, 0.1, 1000.0);
        }
        this.scene.add (this.camera);

        this.projectionMode = projectionMode;
        this.shadingModel.SetProjectionMode (projectionMode);
        this.cameraValidator.ForceUpdate ();

        this.AdjustClippingPlanes ();
        this.Render ();
    }

    Resize (width, height)
    {
        let innerSize = GetDomElementInnerDimensions (this.canvas, width, height);
        this.ResizeRenderer (innerSize.width, innerSize.height);
    }

    ResizeRenderer (width, height)
    {
        if (window.devicePixelRatio) {
            this.renderer.setPixelRatio (window.devicePixelRatio);
        }
        this.renderer.setSize (width, height);
        this.cameraValidator.ForceUpdate ();
        this.Render ();
    }

    FitSphereToWindow (boundingSphere, animation)
    {
        if (boundingSphere === null) {
            return;
        }
        let center = new Coord3D (boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z);
        let radius = boundingSphere.radius;

        let newCamera = this.navigation.GetFitToSphereCamera (center, radius);
        this.navigation.MoveCamera (newCamera, animation ? this.settings.animationSteps : 0);
    }

    AdjustClippingPlanes ()
    {
        let boundingSphere = this.GetBoundingSphere ((meshUserData) => {
            return true;
        });
        this.AdjustClippingPlanesToSphere (boundingSphere);
    }

    AdjustClippingPlanesToSphere (boundingSphere)
    {
        if (boundingSphere === null) {
            return;
        }
        if (boundingSphere.radius < 10.0) {
            this.camera.near = 0.01;
            this.camera.far = 100.0;
        } else if (boundingSphere.radius < 100.0) {
            this.camera.near = 0.1;
            this.camera.far = 1000.0;
        } else if (boundingSphere.radius < 1000.0) {
            this.camera.near = 10.0;
            this.camera.far = 10000.0;
        } else {
            this.camera.near = 100.0;
            this.camera.far = 1000000.0;
        }

        this.cameraValidator.ForceUpdate ();
        this.Render ();
    }

    GetNavigationMode ()
    {
        return this.navigation.GetNavigationMode ();
    }

    SetNavigationMode (navigationMode)
    {
        let oldCamera = this.navigation.GetCamera ();
        let newCamera = this.upVector.SetFixed (navigationMode === NavigationMode.FixedUpVector, oldCamera);
        this.navigation.SetNavigationMode (navigationMode);
        if (newCamera !== null) {
            this.navigation.MoveCamera (newCamera, this.settings.animationSteps);
        }
        this.Render ();
    }

    SetUpVector (upDirection, animate)
    {
        let oldCamera = this.navigation.GetCamera ();
        let newCamera = this.upVector.SetDirection (upDirection, oldCamera);
        let animationSteps = animate ? this.settings.animationSteps : 0;
        this.navigation.MoveCamera (newCamera, animationSteps);
        this.Render ();
    }

    FlipUpVector ()
    {
        let oldCamera = this.navigation.GetCamera ();
        let newCamera = this.upVector.Flip (oldCamera);
        this.navigation.MoveCamera (newCamera, 0);
        this.Render ();
    }

    Render ()
    {
        let navigationCamera = this.navigation.GetCamera ();

        this.camera.position.set (navigationCamera.eye.x, navigationCamera.eye.y, navigationCamera.eye.z);
        this.camera.up.set (navigationCamera.up.x, navigationCamera.up.y, navigationCamera.up.z);
        this.camera.lookAt (new THREE.Vector3 (navigationCamera.center.x, navigationCamera.center.y, navigationCamera.center.z));

        if (this.projectionMode === ProjectionMode.Perspective) {
            if (!this.cameraValidator.ValidatePerspective ()) {
                this.camera.aspect = this.canvas.width / this.canvas.height;
                this.camera.fov = navigationCamera.fov;
                this.camera.updateProjectionMatrix ();
            }
        } else if (this.projectionMode === ProjectionMode.Orthographic) {
            let eyeCenterDistance = CoordDistance3D (navigationCamera.eye, navigationCamera.center);
            if (!this.cameraValidator.ValidateOrthographic (eyeCenterDistance)) {
                let aspect = this.canvas.width / this.canvas.height;
                let eyeCenterDistance = CoordDistance3D (navigationCamera.eye, navigationCamera.center);
                let frustumHalfHeight = eyeCenterDistance * Math.tan (0.5 * navigationCamera.fov * DegRad);
                this.camera.left = -frustumHalfHeight * aspect;
                this.camera.right = frustumHalfHeight * aspect;
                this.camera.top = frustumHalfHeight;
                this.camera.bottom = -frustumHalfHeight;
                this.camera.updateProjectionMatrix ();
            }
        }

        this.shadingModel.UpdateByCamera (navigationCamera);
        this.renderer.render (this.scene, this.camera);
    }

    SetMainObject (object)
    {
        const shadingType = GetShadingTypeOfObject (object);
        this.mainModel.SetMainObject (object);
        this.shadingModel.SetShadingType (shadingType);
        this.UpdateModelOpacity ();

        this.Render ();
    }

    AddExtraObject (object)
    {
        this.extraModel.AddObject (object);
        this.Render ();
    }

    Clear ()
    {
        this.mainModel.Clear ();
        this.extraModel.Clear ();
        this.surfaceStrainModel.Clear ();
        this.surfaceStrain = null;
        this.edgeHighlightModel.Clear ();
        this.edgeHighlight = null;
        this.UpdatePolygonOffsetFactor ();
        this.Render ();
    }

    /**
     * Shows a mapped surface strain field instead of the model's meshes. Edges stay visible.
     * @param {SurfaceStrainMapping} mapping Result of MapSurfaceStrainToModel.
     * @param {SurfaceStrainColorScale} colorScale Color scale.
     */
    SetSurfaceStrain (mapping, colorScale)
    {
        this.surfaceStrainModel.Clear ();
        this.surfaceStrain = new ViewerSurfaceStrain (mapping, colorScale);
        this.surfaceStrainModel.SetRootObject (this.surfaceStrain.CreateThreeObject (this.shadingModel.type));
        this.UpdatePolygonOffsetFactor ();
        this.UpdateMeshesVisibility ();
        this.UpdateModelOpacity ();
        this.Render ();
    }

    /**
     * Recolors the shown surface strain without mapping it again.
     * @param {SurfaceStrainColorScale|SurfaceStrainThresholdScale} colorScale New color scale.
     * @returns {boolean} False if no surface strain is shown.
     */
    SetSurfaceStrainColorScale (colorScale)
    {
        if (this.surfaceStrain === null) {
            return false;
        }
        this.SetSurfaceStrain (this.surfaceStrain.mapping, colorScale);
        return true;
    }

    HasSurfaceStrain ()
    {
        return this.surfaceStrain !== null;
    }

    ClearSurfaceStrain ()
    {
        if (this.surfaceStrain === null) {
            return;
        }
        this.surfaceStrainModel.Clear ();
        this.surfaceStrain = null;
        this.UpdateMeshesVisibility ();
        this.Render ();
    }

    /**
     * Shows prepared edge highlights on top of the model, replacing the shown ones.
     * @param {PreparedEdgeHighlight[]} prepared Result of PrepareEdgeHighlights.
     */
    SetEdgeHighlights (prepared)
    {
        this.edgeHighlightModel.Clear ();
        this.edgeHighlight = null;
        if (prepared.length > 0) {
            this.edgeHighlight = new ViewerEdgeHighlight (prepared);
            this.edgeHighlightModel.SetRootObject (this.edgeHighlight.CreateThreeObject ());
        }
        this.UpdatePolygonOffsetFactor ();
        this.UpdateModelOpacity ();
        this.Render ();
    }

    HasEdgeHighlights ()
    {
        return this.edgeHighlight !== null;
    }

    ClearEdgeHighlights ()
    {
        if (this.edgeHighlight === null) {
            return;
        }
        this.edgeHighlightModel.Clear ();
        this.edgeHighlight = null;
        this.UpdatePolygonOffsetFactor ();
        this.Render ();
    }

    /**
     * Thick edge highlights are flat quads facing the camera, while the walls next to an inside
     * corner rise toward the camera across the line's width and would cover part of it. The polygon
     * offset factor pushes every triangle back in proportion to its own depth slope, so raising it
     * on the meshes the lines lie on keeps the lines whole at any slope. Faces turned to the camera
     * have almost no slope and stay put, so hidden edges don't show through them.
     */
    UpdatePolygonOffsetFactor ()
    {
        let factor = (this.edgeHighlight !== null ? this.edgeHighlight.GetMeshPolygonOffsetFactor () : 1);
        this.mainModel.SetPolygonOffsetFactor (factor);
        this.surfaceStrainModel.Traverse ((obj) => {
            if (obj.isMesh) {
                obj.material.polygonOffsetFactor = factor;
            }
        });
    }

    /**
     * Fades the model, the surface strain overlay and highlighted meshes, and draws the edge
     * highlights on top of them, so edges behind the model show through it. It is a setting like
     * the edge settings: it stays through model loads and overlay changes.
     * @param {number} opacity In (0, 1], 1 shows the model solid.
     * @returns {boolean} False if opacity is out of range, and nothing changes.
     */
    SetModelOpacity (opacity)
    {
        if (typeof opacity !== 'number' || !Number.isFinite (opacity) || opacity <= 0.0 || opacity > 1.0) {
            return false;
        }
        this.modelOpacity = opacity;
        this.UpdateModelOpacity ();
        this.Render ();
        return true;
    }

    GetModelOpacity ()
    {
        return this.modelOpacity;
    }

    /**
     * Applies modelOpacity to every material the viewer shows. The faded value is computed from the
     * material's original values, so it can run again any time, and a material shared by many
     * meshes, or a highlighted mesh's own materials, are never faded twice. Faded surfaces don't
     * write depth, so the edge highlights behind them pass the depth test. The edge highlights
     * draw after them, otherwise the faded surfaces would blend over the lines and dim them.
     */
    UpdateModelOpacity ()
    {
        let isFaded = (this.modelOpacity < 1.0);
        let updateMaterial = (material) => {
            if (material === null || material === undefined) {
                return;
            }
            let original = this.modelOpacityOriginals.get (material);
            if (isFaded) {
                if (original === undefined) {
                    original = {
                        transparent : material.transparent,
                        opacity : material.opacity,
                        depthWrite : material.depthWrite
                    };
                    this.modelOpacityOriginals.set (material, original);
                }
                SetMaterialOpacity (material, true, original.opacity * this.modelOpacity, false);
            } else if (original !== undefined) {
                SetMaterialOpacity (material, original.transparent, original.opacity, original.depthWrite);
                this.modelOpacityOriginals.delete (material);
            }
        };
        let updateMaterials = (materials) => {
            if (Array.isArray (materials)) {
                for (let material of materials) {
                    updateMaterial (material);
                }
            } else {
                updateMaterial (materials);
            }
        };

        this.mainModel.EnumerateMeshes ((mesh) => {
            updateMaterials (mesh.material);
            // The mesh's own materials while it is highlighted, they come back when it isn't.
            if (mesh.userData.threeMaterials) {
                updateMaterials (mesh.userData.threeMaterials);
            }
        });
        this.surfaceStrainModel.Traverse ((obj) => {
            if (obj.isMesh) {
                updateMaterials (obj.material);
            }
        });
        this.edgeHighlightModel.Traverse ((obj) => {
            if (obj.material !== undefined) {
                // three.js sorts the transparent objects by renderOrder first.
                obj.renderOrder = (isFaded ? 1 : 0);
                if (obj.material.transparent !== isFaded) {
                    obj.material.transparent = isFaded;
                    obj.material.needsUpdate = true;
                }
            }
        });
    }

    ClearExtra ()
    {
        this.extraModel.Clear ();
        this.Render ();
    }

    SetMeshesVisibility (isVisible)
    {
        // The caller's choice is kept on userData, separate from the surface strain overlay hiding
        // the meshes. Edges share the userData of their mesh.
        this.mainModel.EnumerateMeshesAndLines ((mesh) => {
            mesh.userData.userVisible = isVisible (mesh.userData);
        });
        this.UpdateMeshesVisibility ();
        this.Render ();
    }

    UpdateMeshesVisibility ()
    {
        let hasSurfaceStrain = this.HasSurfaceStrain ();
        let hiddenMeshInstances = new Set ();
        this.mainModel.EnumerateMeshesAndLines ((mesh) => {
            let visible = (mesh.userData.userVisible !== false);
            if (mesh.isMesh) {
                if (!visible) {
                    hiddenMeshInstances.add (mesh.userData.originalMeshInstance.id.GetKey ());
                }
                // The overlay replaces the meshes, but not the lines.
                mesh.visible = visible && !hasSurfaceStrain;
            } else {
                mesh.visible = visible;
            }
        });
        this.mainModel.EnumerateEdges ((edge) => {
            edge.visible = (edge.userData.userVisible !== false);
        });
        this.surfaceStrainModel.Traverse ((obj) => {
            if (obj.isMesh) {
                obj.visible = !hiddenMeshInstances.has (obj.userData.surfaceStrain.meshInstanceId.GetKey ());
            }
        });
    }

    SetMeshesHighlight (highlightColor, isHighlighted)
    {
        let withPolygonOffset = this.mainModel.NeedsPolygonOffset ();
        let polygonOffsetFactor = this.mainModel.polygonOffsetFactor;
        this.mainModel.EnumerateMeshesAndLines ((mesh) => {
            let highlighted = isHighlighted (mesh.userData);
            if (highlighted) {
                if (mesh.userData.threeMaterials === null) {
                    mesh.userData.threeMaterials = mesh.material;
                    mesh.material = CreateHighlightMaterials (mesh.userData.threeMaterials, highlightColor, withPolygonOffset, polygonOffsetFactor);
                }
            } else {
                if (mesh.userData.threeMaterials !== null) {
                    mesh.material = mesh.userData.threeMaterials;
                    mesh.userData.threeMaterials = null;
                }
            }
        });

        this.UpdateModelOpacity ();
        this.Render ();
    }

    GetMeshUserDataUnderMouse (intersectionMode, mouseCoords)
    {
        let intersection = this.GetMeshIntersectionUnderMouse (intersectionMode, mouseCoords);
        if (intersection === null) {
            return null;
        }
        return intersection.object.userData;
    }

    GetMeshIntersectionUnderMouse (intersectionMode, mouseCoords)
    {
        let canvasSize = this.GetCanvasSize ();
        let intersection = this.mainModel.GetMeshIntersectionUnderMouse (intersectionMode, mouseCoords, this.camera, canvasSize.width, canvasSize.height);
        if (intersection === null) {
            return null;
        }
        return intersection;
    }

    GetBoundingBox (needToProcess)
    {
        return this.mainModel.GetBoundingBox (needToProcess);
    }

    GetBoundingSphere (needToProcess)
    {
        return this.mainModel.GetBoundingSphere (needToProcess);
    }

    EnumerateMeshesAndLinesUserData (enumerator)
    {
        this.mainModel.EnumerateMeshesAndLines ((mesh) => {
            enumerator (mesh.userData);
        });
    }

    InitNavigation ()
    {
        let camera = GetDefaultCamera (Direction.Y);
        this.camera = new THREE.PerspectiveCamera (45.0, 1.0, 0.1, 1000.0);
        this.projectionMode = ProjectionMode.Perspective;
        this.cameraValidator = new CameraValidator ();
        this.scene.add (this.camera);

        let canvasElem = this.renderer.domElement;
        this.navigation = new Navigation (canvasElem, camera, {
            onUpdate : () => {
                this.Render ();
            }
        });

        this.upVector = new UpVector ();
    }

    InitShading  ()
    {
        this.shadingModel = new ShadingModel (this.scene);
    }

    GetShadingType ()
    {
        return this.shadingModel.type;
    }

    GetImageSize ()
    {
        let originalSize = new THREE.Vector2 ();
        this.renderer.getSize (originalSize);
        return {
            width : parseInt (originalSize.x, 10),
            height : parseInt (originalSize.y, 10)
        };
    }

    GetCanvasSize ()
    {
        let width = this.canvas.width;
        let height = this.canvas.height;
        if (window.devicePixelRatio) {
            width /= window.devicePixelRatio;
            height /= window.devicePixelRatio;
        }
        return {
            width : width,
            height : height
        };
    }

    GetImageAsDataUrl (width, height, isTransparent)
    {
        let originalSize = this.GetImageSize ();
        let renderWidth = width;
        let renderHeight = height;
        if (window.devicePixelRatio) {
            renderWidth /= window.devicePixelRatio;
            renderHeight /= window.devicePixelRatio;
        }
        let clearAlpha = this.renderer.getClearAlpha ();
        if (isTransparent) {
            this.renderer.setClearAlpha (0.0);
        }
        this.ResizeRenderer (renderWidth, renderHeight);
        this.Render ();
        let url = this.renderer.domElement.toDataURL ();
        this.ResizeRenderer (originalSize.width, originalSize.height);
        this.renderer.setClearAlpha (clearAlpha);
        return url;
    }

    Destroy ()
    {
        this.Clear ();
        this.renderer.dispose ();
    }
}
