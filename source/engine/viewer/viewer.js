import { Coord3D, CoordDistance3D, SubCoord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { ColorToHexString } from '../model/color.js';
import { ShadingType } from '../threejs/threeutils.js';
import { GetDomElementInnerDimensions } from './domutils.js';
import { Camera, CameraIsEqual3D, Navigation } from './navigation.js';
import { ViewerExtraGeometry, ViewerGeometry } from './viewergeometry.js';

export function GetDefaultCamera (direction)
{
    if (direction === Direction.X) {
        return new CameraIsEqual3D (
            new Coord3D (2.0, -3.0, 1.5),
            new Coord3D (0.0, 0.0, 0.0),
            new Coord3D (1.0, 0.0, 0.0)
        );
    } else if (direction === Direction.Y) {
        return new Camera (
            new Coord3D (-1.5, 2.0, 3.0),
            new Coord3D (0.0, 0.0, 0.0),
            new Coord3D (0.0, 1.0, 0.0)
        );
    } else if (direction === Direction.Z) {
        return new Camera (
            new Coord3D (-1.5, -3.0, 2.0),
            new Coord3D (0.0, 0.0, 0.0),
            new Coord3D (0.0, 0.0, 1.0)
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

export class UpVector
{
    constructor ()
    {
        this.direction = Direction.Z;
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
        } if (this.direction === Direction.Y) {
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

export class ShadingModel
{
    constructor (scene)
    {
        this.scene = scene;

        this.type = ShadingType.Phong;
        this.ambientLight = new THREE.AmbientLight (0x888888);
        this.directionalLight = new THREE.DirectionalLight (0x888888);
        this.environment = null;

        this.scene.add (this.ambientLight);
        this.scene.add (this.directionalLight);
    }

    SetType (type)
    {
        this.type = type;
        if (this.type === ShadingType.Phong) {
            this.ambientLight.color.set (0x888888);
            this.directionalLight.color.set (0x888888);
            this.scene.environment = null;
        } else if (this.type === ShadingType.Physical) {
            this.ambientLight.color.set (0x000000);
            this.directionalLight.color.set (0x555555);
            this.scene.environment = this.environment;
        }
    }

    SetEnvironment (textures, onLoaded)
    {
        let loader = new THREE.CubeTextureLoader ();
        this.environment = loader.load (textures, () => {
            onLoaded ();
        });
    }

    UpdateByCamera (camera)
    {
        const lightDir = SubCoord3D (camera.eye, camera.center);
        this.directionalLight.position.set (lightDir.x, lightDir.y, lightDir.z);
    }

    CreateHighlightMaterial (highlightColor, withOffset)
    {
        let material = null;
        if (this.type === ShadingType.Phong) {
            material = new THREE.MeshPhongMaterial ({
                color : highlightColor,
                side : THREE.DoubleSide
            });
        } else if (this.type === ShadingType.Physical) {
            material = new THREE.MeshStandardMaterial ({
                color : highlightColor,
                side : THREE.DoubleSide
            });
        }
        if (material !== null && withOffset) {
            material.polygonOffset = true;
            material.polygonOffsetUnit = 1;
            material.polygonOffsetFactor = 1;
        }
        return material;
    }
}

export class Viewer
{
    constructor ()
    {
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.geometry = null;
        this.extraGeometry = null;
        this.camera = null;
        this.shading = null;
        this.navigation = null;
        this.upVector = null;
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
        if (window.devicePixelRatio) {
            this.renderer.setPixelRatio (window.devicePixelRatio);
        }
        this.renderer.setClearColor ('#ffffff', 1.0);
        this.renderer.setSize (this.canvas.width, this.canvas.height);

        this.scene = new THREE.Scene ();
        this.geometry = new ViewerGeometry (this.scene);
        this.extraGeometry = new ViewerExtraGeometry (this.scene);

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

    SetBackgroundColor (color)
    {
        let hexColor = '#' + ColorToHexString (color);
        this.renderer.setClearColor (hexColor, 1.0);
        this.Render ();
    }

    SetGridSettings (show)
    {
        this.geometry.SetGridSettings (show);
        this.Render ();
    }

    SetEdgeSettings (show, color, threshold)
    {
        this.geometry.SetEdgeSettings (show, color, threshold);
        this.Render ();
    }

    SetEnvironmentMap (textures)
    {
        this.shading.SetEnvironment (textures, () => {
            this.Render ();
        });
    }

    GetCanvas ()
    {
        return this.canvas;
    }

    GetCamera ()
    {
        return this.navigation.GetCamera ();
    }

    SetCamera (camera)
    {
        this.navigation.SetCamera (camera);
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
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix ();
        this.renderer.setSize (width, height);
        this.Render ();
    }

    FitSphereToWindow (boundingSphere, animation)
    {
        if (boundingSphere === null) {
            return;
        }
        let center = new Coord3D (boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z);
        let radius = boundingSphere.radius;
        let fov = this.camera.fov;

        let newCamera = this.navigation.GetFitToSphereCamera (center, radius, fov);
        this.navigation.MoveCamera (newCamera, animation ? this.settings.animationSteps : 0);
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
        this.camera.updateProjectionMatrix ();
        this.Render ();
    }

    IsFixUpVector ()
    {
        return this.navigation.IsFixUpVector ();
    }

    SetFixUpVector (fixUpVector)
    {
        let oldCamera = this.navigation.GetCamera ();
        let newCamera = this.upVector.SetFixed (fixUpVector, oldCamera);
        this.navigation.SetFixUpVector (fixUpVector);
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

        this.shading.UpdateByCamera (navigationCamera);
        this.renderer.render (this.scene, this.camera);
    }

    SetMainObject (object)
    {
        const shadingType = GetShadingTypeOfObject (object);
        this.geometry.SetMainObject (object);
        this.shading.SetType (shadingType);

        this.Render ();
    }

    AddExtraObject (object)
    {
        this.extraGeometry.AddObject (object);
        this.Render ();
    }

    Clear ()
    {
        this.geometry.Clear ();
        this.extraGeometry.Clear ();
        this.Render ();
    }

    ClearExtra ()
    {
        this.extraGeometry.Clear ();
        this.Render ();
    }

    SetMeshesVisibility (isVisible)
    {
        this.geometry.EnumerateMeshes ((mesh) => {
            let visible = isVisible (mesh.userData);
            if (mesh.visible !== visible) {
                mesh.visible = visible;
            }
        });
        this.geometry.EnumerateEdges ((edge) => {
            let visible = isVisible (edge.userData);
            if (edge.visible !== visible) {
                edge.visible = visible;
            }
        });
        this.Render ();
    }

    SetMeshesHighlight (highlightColor, isHighlighted)
    {
        function CreateHighlightMaterials (originalMaterials, highlightMaterial)
        {
            let highlightMaterials = [];
            for (let i = 0; i < originalMaterials.length; i++) {
                highlightMaterials.push (highlightMaterial);
            }
            return highlightMaterials;
        }

        const highlightMaterial = this.CreateHighlightMaterial (highlightColor);
        this.geometry.EnumerateMeshes ((mesh) => {
            let highlighted = isHighlighted (mesh.userData);
            if (highlighted) {
                if (mesh.userData.threeMaterials === null) {
                    mesh.userData.threeMaterials = mesh.material;
                    mesh.material = CreateHighlightMaterials (mesh.material, highlightMaterial);
                }
            } else {
                if (mesh.userData.threeMaterials !== null) {
                    mesh.material = mesh.userData.threeMaterials;
                    mesh.userData.threeMaterials = null;
                }
            }
        });

        this.Render ();
    }

    CreateHighlightMaterial (highlightColor)
    {
        const showEdges = this.geometry.edgeSettings.showEdges;
        return this.shading.CreateHighlightMaterial (highlightColor, showEdges);
    }

    GetMeshUserDataUnderMouse (mouseCoords)
    {
        let intersection = this.GetMeshIntersectionUnderMouse (mouseCoords);
        if (intersection === null) {
            return null;
        }
        return intersection.object.userData;
    }

    GetMeshIntersectionUnderMouse (mouseCoords)
    {
        let canvasSize = this.GetCanvasSize ();
        let intersection = this.geometry.GetMeshIntersectionUnderMouse (mouseCoords, this.camera, canvasSize.width, canvasSize.height);
        if (intersection === null) {
            return null;
        }
        return intersection;
    }

    GetBoundingBox (needToProcess)
    {
        return this.geometry.GetBoundingBox (needToProcess);
    }

    GetBoundingSphere (needToProcess)
    {
        return this.geometry.GetBoundingSphere (needToProcess);
    }

    EnumerateMeshesUserData (enumerator)
    {
        this.geometry.EnumerateMeshes ((mesh) => {
            enumerator (mesh.userData);
        });
    }

    InitNavigation ()
    {
        this.camera = new THREE.PerspectiveCamera (45.0, this.canvas.width / this.canvas.height, 0.1, 1000.0);
        this.scene.add (this.camera);

        let canvasElem = this.renderer.domElement;
        let camera = GetDefaultCamera (Direction.Z);

        this.navigation = new Navigation (canvasElem, camera, {
            onUpdate : () => {
                this.Render ();
            }
        });

        this.upVector = new UpVector ();
    }

    InitShading  ()
    {
        this.shading = new ShadingModel (this.scene);
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

    GetImageAsDataUrl (width, height)
    {
        let originalSize = this.GetImageSize ();
        let renderWidth = width;
        let renderHeight = height;
        if (window.devicePixelRatio) {
            renderWidth /= window.devicePixelRatio;
            renderHeight /= window.devicePixelRatio;
        }
        this.ResizeRenderer (renderWidth, renderHeight);
        this.Render ();
        let url = this.renderer.domElement.toDataURL ();
        this.ResizeRenderer (originalSize.width, originalSize.height);
        return url;
    }
}
