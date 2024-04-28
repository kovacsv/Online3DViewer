import { Direction } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { Transformation } from '../geometry/transformation.js';
import { GetFileName } from '../io/fileutils.js';
import { PhongMaterial, PhysicalMaterial } from '../model/material.js';
import { TransformMesh } from '../model/meshutils.js';
import { IsModelEmpty } from '../model/modelutils.js';
import { Property, PropertyGroup, PropertyType } from '../model/property.js';
import { ConvertThreeGeometryToMesh } from '../threejs/threeutils.js';
import { ImporterBase } from './importerbase.js';
import { LoadExternalLibrary, UpdateMaterialTransparency } from './importerutils.js';
import { TextureMap } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Line } from '../model/line.js';
import { ArrayToCoord3D } from '../geometry/coord3d.js';
import { Loc } from '../core/localization.js';

export class Importer3dm extends ImporterBase
{
    constructor ()
    {
        super ();
        this.rhino = null;
    }

    CanImportExtension (extension)
    {
        return extension === '3dm';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    ClearContent ()
    {
        this.instanceIdToObject = null;
        this.instanceIdToDefinition = null;
    }

    ResetContent ()
    {
        this.instanceIdToObject = new Map ();
        this.instanceIdToDefinition = new Map ();
    }

    ImportContent (fileContent, onFinish)
    {
        if (this.rhino === null) {
            LoadExternalLibrary ('rhino3dm').then (() => {
                rhino3dm ().then ((rhino) => {
                    this.rhino = rhino;
                    this.ImportRhinoContent (fileContent);
                    onFinish ();
                });
            }).catch (() => {
                this.SetError (Loc ('Failed to load rhino3dm.'));
                onFinish ();
            });
        } else {
            this.ImportRhinoContent (fileContent);
            onFinish ();
        }
    }

    ImportRhinoContent (fileContent)
    {
        let rhinoDoc = this.rhino.File3dm.fromByteArray (fileContent);
        if (rhinoDoc === null) {
            this.SetError (Loc ('Failed to read Rhino file.'));
            return;
        }
        this.ImportRhinoDocument (rhinoDoc);
        if (IsModelEmpty (this.model)) {
            this.SetError (Loc ('The model doesn\'t contain any 3D meshes. Try to save the model while you are in shaded view in Rhino.'));
        }
    }

    ImportRhinoDocument (rhinoDoc)
    {
        this.InitRhinoInstances (rhinoDoc);
        this.ImportRhinoUserStrings (rhinoDoc);
        this.ImportRhinoGeometry (rhinoDoc);
    }

    InitRhinoInstances (rhinoDoc)
    {
        let rhinoObjects = rhinoDoc.objects ();
        for (let i = 0; i < rhinoObjects.count; i++) {
            let rhinoObject = rhinoObjects.get (i);
            let rhinoAttributes = rhinoObject.attributes ();
            if (rhinoAttributes.isInstanceDefinitionObject) {
                this.instanceIdToObject.set (rhinoAttributes.id, rhinoObject);
            }
        }
        let rhinoInstanceDefinitions = rhinoDoc.instanceDefinitions ();
        for (let i = 0; i < rhinoInstanceDefinitions.count; i++) {
            let rhinoInstanceDefinition = rhinoInstanceDefinitions.get (i);
            this.instanceIdToDefinition.set (rhinoInstanceDefinition.id, rhinoInstanceDefinition);
        }
    }

    ImportRhinoUserStrings (rhinoDoc)
    {
        let docStrings = rhinoDoc.strings ();
        if (docStrings.count > 0) {
            let propertyGroup = new PropertyGroup (Loc ('Document user texts'));
            for (let i = 0; i < docStrings.count; i++) {
                let docString = docStrings.get (i);
                propertyGroup.AddProperty (new Property (PropertyType.Text, docString[0], docString[1]));
            }
            this.model.AddPropertyGroup (propertyGroup);
        }
    }

    ImportRhinoGeometry (rhinoDoc)
    {
        let rhinoObjects = rhinoDoc.objects ();
        for (let i = 0; i < rhinoObjects.count; i++) {
            let rhinoObject = rhinoObjects.get (i);
            this.ImportRhinoGeometryObject (rhinoDoc, rhinoObject, []);
        }
    }

    ImportRhinoGeometryObject (rhinoDoc, rhinoObject, rhinoInstanceReferences)
    {
        let rhinoGeometry = rhinoObject.geometry ();
        let rhinoAttributes = rhinoObject.attributes ();

        let objectType = rhinoGeometry.objectType;
        if (rhinoAttributes.isInstanceDefinitionObject && rhinoInstanceReferences.length === 0) {
            return;
        }

        if (objectType === this.rhino.ObjectType.Mesh) {
            this.ImportRhinoGeometryAsMesh (rhinoDoc, rhinoGeometry, rhinoObject, rhinoInstanceReferences);
        } else if (objectType === this.rhino.ObjectType.Extrusion) {
            let rhinoMesh = rhinoGeometry.getMesh (this.rhino.MeshType.Any);
            if (rhinoMesh !== null) {
                this.ImportRhinoGeometryAsMesh (rhinoDoc, rhinoMesh, rhinoObject, rhinoInstanceReferences);
                rhinoMesh.delete ();
            }
        } else if (objectType === this.rhino.ObjectType.Brep) {
            let rhinoMesh = new this.rhino.Mesh ();
            let faces = rhinoGeometry.faces ();
            for (let i = 0; i < faces.count; i++) {
                let face = faces.get (i);
                let mesh = face.getMesh (this.rhino.MeshType.Any);
                if (mesh) {
                    rhinoMesh.append (mesh);
                    mesh.delete ();
                }
                face.delete ();
            }
            faces.delete ();
            rhinoMesh.compact ();
            this.ImportRhinoGeometryAsMesh (rhinoDoc, rhinoMesh, rhinoObject, rhinoInstanceReferences);
            rhinoMesh.delete ();
        } else if (objectType === this.rhino.ObjectType.SubD) {
            rhinoGeometry.subdivide (3);
            let rhinoMesh = this.rhino.Mesh.createFromSubDControlNet (rhinoGeometry, true);
            if (rhinoMesh !== null) {
                this.ImportRhinoGeometryAsMesh (rhinoDoc, rhinoMesh, rhinoObject, rhinoInstanceReferences);
                rhinoMesh.delete ();
            }
        } else if (objectType === this.rhino.ObjectType.Curve) {
            this.ImportRhinoGeometryAsMesh (rhinoDoc, rhinoGeometry, rhinoObject, rhinoInstanceReferences);
        } else if (objectType === this.rhino.ObjectType.InstanceReference) {
            let parentDefinitionId = rhinoGeometry.parentIdefId;
            if (this.instanceIdToDefinition.has (parentDefinitionId)) {
                let instanceDefinition = this.instanceIdToDefinition.get (parentDefinitionId);
                let instanceObjectIds = instanceDefinition.getObjectIds ();
                for (let i = 0; i < instanceObjectIds.length; i++) {
                    let instanceObjectId = instanceObjectIds[i];
                    if (this.instanceIdToObject.has (instanceObjectId)) {
                        let instanceObject = this.instanceIdToObject.get (instanceObjectId);
                        rhinoInstanceReferences.push (rhinoObject);
                        this.ImportRhinoGeometryObject (rhinoDoc, instanceObject, rhinoInstanceReferences);
                        rhinoInstanceReferences.pop ();
                    }
                }
            }
        }
    }

    ImportRhinoGeometryAsMesh (rhinoDoc, rhinoGeometry, rhinoObject, rhinoInstanceReferences)
    {
        function GetSegmentedCurveLine (curveGeometry)
        {
            let domainLength = curveGeometry.domain[1] - curveGeometry.domain[0];
            let segmentCount = Math.max (parseInt (domainLength / 0.2, 10), 1);
            let segmentLength = domainLength / segmentCount;
            let vertices = [];
            for (let i = 0; i <= segmentCount; i++) {
                if (i === segmentCount && curveGeometry.isClosed) {
                    vertices.push (vertices[0]);
                } else {
                    let position = rhinoGeometry.pointAt (curveGeometry.domain[0] + i * segmentLength);
                    vertices.push (mesh.AddVertex (ArrayToCoord3D (position)));
                }
            }
            return new Line (vertices);
        }

        let materialIndex = this.GetMaterialIndex (rhinoDoc, rhinoObject, rhinoInstanceReferences);
        let mesh = null;
        if (rhinoGeometry.objectType === this.rhino.ObjectType.Mesh) {
            let threeJson = rhinoGeometry.toThreejsJSON ();
            mesh = ConvertThreeGeometryToMesh (threeJson.data, materialIndex, null);
        } else if (rhinoGeometry.objectType === this.rhino.ObjectType.Curve) {
            mesh = new Mesh ();
            if (rhinoGeometry instanceof this.rhino.LineCurve) {
                let fromVertex = mesh.AddVertex (ArrayToCoord3D (rhinoGeometry.line.from));
                let toVertex = mesh.AddVertex (ArrayToCoord3D (rhinoGeometry.line.to));
                let line = new Line ([fromVertex, toVertex]);
                line.SetMaterial (materialIndex);
                mesh.AddLine (line);
            } else if (rhinoGeometry instanceof this.rhino.NurbsCurve) {
                let line = GetSegmentedCurveLine (rhinoGeometry);
                line.SetMaterial (materialIndex);
                mesh.AddLine (line);
            } else if (rhinoGeometry instanceof this.rhino.ArcCurve) {
                let line = GetSegmentedCurveLine (rhinoGeometry);
                line.SetMaterial (materialIndex);
                mesh.AddLine (line);
            }
        }

        // TODO: BezierCurve, PolyCurve

        if (mesh === null) {
            return null;
        }

        let rhinoAttributes = rhinoObject.attributes ();
        mesh.SetName (rhinoAttributes.name);

        let userStrings = rhinoAttributes.getUserStrings ();
        if (userStrings.length > 0) {
            let propertyGroup = new PropertyGroup (Loc ('User texts'));
            for (let i = 0; i < userStrings.length; i++) {
                let userString = userStrings[i];
                propertyGroup.AddProperty (new Property (PropertyType.Text, userString[0], userString[1]));
            }
            mesh.AddPropertyGroup (propertyGroup);
        }

        if (rhinoInstanceReferences.length !== 0) {
            let matrix = new Matrix ().CreateIdentity ();
            for (let i = rhinoInstanceReferences.length - 1; i >= 0; i--) {
                let rhinoInstanceReference = rhinoInstanceReferences[i];
                let rhinoInstanceReferenceGeometry = rhinoInstanceReference.geometry ();
                let rhinoInstanceReferenceMatrix = rhinoInstanceReferenceGeometry.xform.toFloatArray (false);
                let transformationMatrix = new Matrix (rhinoInstanceReferenceMatrix);
                matrix = matrix.MultiplyMatrix (transformationMatrix);
            }
            let transformation = new Transformation (matrix);
            TransformMesh (mesh, transformation);
        }
        this.model.AddMeshToRootNode (mesh);
    }

    GetMaterialIndex (rhinoDoc, rhinoObject, rhinoInstanceReferences)
    {
        function GetRhinoMaterial (rhino, rhinoObject, rhinoInstanceReferences)
        {
            let rhinoAttributes = rhinoObject.attributes ();
            if (rhinoAttributes.materialSource === rhino.ObjectMaterialSource.MaterialFromObject) {
                let materialIndex = rhinoAttributes.materialIndex;
                if (materialIndex > -1) {
                    return rhinoDoc.materials ().get (materialIndex);
                }
            } else if (rhinoAttributes.materialSource === rhino.ObjectMaterialSource.MaterialFromLayer) {
                let layerIndex = rhinoAttributes.layerIndex;
                if (layerIndex > -1) {
                    let layer = rhinoDoc.layers ().get (layerIndex);
                    let layerMaterialIndex = layer.renderMaterialIndex;
                    if (layerMaterialIndex > -1) {
                        return rhinoDoc.materials ().get (layerMaterialIndex);
                    } else {
                        // use layer color only in case of curves
                        let rhinoGeometry = rhinoObject.geometry ();
                        if (rhinoGeometry.objectType === rhino.ObjectType.Curve) {
                            let material = new rhino.Material ();
                            material.name = layer.name;
                            material.diffuseColor = layer.color;
                            return material;
                        }
                    }
                }
            } else if (rhinoAttributes.materialSource === rhino.ObjectMaterialSource.MaterialFromParent) {
                if (rhinoInstanceReferences.length !== 0) {
                    return GetRhinoMaterial (rhino, rhinoInstanceReferences[0], []);
                }
            }
            return null;
        }

        function ConvertRhinoMaterial (rhinoMaterial, callbacks)
        {
            function SetColor (color, rhinoColor)
            {
                color.Set (rhinoColor.r, rhinoColor.g, rhinoColor.b);
            }

            function IsBlack (rhinoColor)
            {
                return rhinoColor.r === 0 && rhinoColor.g === 0 && rhinoColor.b === 0;
            }

            function IsWhite (rhinoColor)
            {
                return rhinoColor.r === 255 && rhinoColor.g === 255 && rhinoColor.b === 255;
            }

            let material = null;
            let physicallyBased = rhinoMaterial.physicallyBased ();
            if (physicallyBased.supported) {
                material = new PhysicalMaterial ();
                material.metalness = physicallyBased.metallic ? 1.0 : 0.0;
                material.roughness = physicallyBased.roughness;
            } else {
                material = new PhongMaterial ();
                SetColor (material.ambient, rhinoMaterial.ambientColor);
                SetColor (material.specular, rhinoMaterial.specularColor);
            }

            material.name = rhinoMaterial.name;

            SetColor (material.color, rhinoMaterial.diffuseColor);
            material.opacity = 1.0 - rhinoMaterial.transparency;
            UpdateMaterialTransparency (material);

            if (IsBlack (material.color) && !IsWhite (rhinoMaterial.reflectionColor)) {
                SetColor (material.color, rhinoMaterial.reflectionColor);
            }
            if (IsBlack (material.color) && !IsWhite (rhinoMaterial.transparentColor)) {
                SetColor (material.color, rhinoMaterial.transparentColor);
            }

            let rhinoTexture = rhinoMaterial.getBitmapTexture ();
            if (rhinoTexture) {
                let texture = new TextureMap ();
                let textureName = GetFileName (rhinoTexture.fileName);
                let textureBuffer = callbacks.getFileBuffer (textureName);
                texture.name = textureName;
                texture.buffer = textureBuffer;
                material.diffuseMap = texture;
            }

            return material;
        }

        function FindMatchingMaterial (model, rhinoMaterial, callbacks)
        {
            let material = ConvertRhinoMaterial (rhinoMaterial, callbacks);
            for (let i = 0; i < model.MaterialCount (); i++) {
                let current = model.GetMaterial (i);
                if (current.IsEqual (material)) {
                    return i;
                }
            }
            return model.AddMaterial (material);
        }

        let rhinoMaterial = GetRhinoMaterial (this.rhino, rhinoObject, rhinoInstanceReferences);
        if (rhinoMaterial === null) {
            return null;
        }
        return FindMatchingMaterial (this.model, rhinoMaterial, this.callbacks);
    }
}
