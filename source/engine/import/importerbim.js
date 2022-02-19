import { Coord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { ArrayBufferToUtf8String } from '../io/bufferutils.js';
import { Node, NodeType } from '../model/node.js';
import { PhongMaterial } from '../model/material.js';
import { Color, IntegerToHexString } from '../model/color.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { Quaternion } from '../geometry/quaternion.js';
import { Matrix } from '../geometry/matrix.js';
import { Transformation } from '../geometry/transformation.js';
import { UpdateMaterialTransparency } from './importerutils.js';
import { Property, PropertyGroup, PropertyType } from '../model/property.js';

export class ImporterBim extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'bim';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    ClearContent ()
    {
        this.meshIdToMesh = null;
        this.colorToMaterialIndex = null;
    }

    ResetContent ()
    {
        this.meshIdToMesh = new Map ();
        this.colorToMaterialIndex = new Map ();
    }

    ImportContent (fileContent, onFinish)
    {
        let textContent = ArrayBufferToUtf8String (fileContent);
        let bimJson = null;
        try {
            bimJson = JSON.parse (textContent);
        } catch (err) {
            this.SetError ('Failed to parse bim file.');
            onFinish ();
            return;
        }

        for (let bimMesh of bimJson.meshes) {
            this.meshIdToMesh.set (bimMesh.mesh_id, bimMesh);
        }

        this.ImportProperties (bimJson, this.model);
        for (let bimElement of bimJson.elements) {
            let mesh = this.ImportElement (bimElement);
            mesh.SetName (bimElement.type);
            this.ImportProperties (bimElement, mesh);
        }

        onFinish ();
    }

    ImportElement (bimElement)
    {
        let materialIndex = null;
        if (bimElement.color) {
            let colorKey =
                IntegerToHexString (bimElement.color.r) +
                IntegerToHexString (bimElement.color.g) +
                IntegerToHexString (bimElement.color.b) +
                IntegerToHexString (bimElement.color.a);
            if (this.colorToMaterialIndex.has (colorKey)) {
                materialIndex = this.colorToMaterialIndex.get (colorKey);
            } else {
                let material = new PhongMaterial ();
                material.name = colorKey;
                material.color = new Color (bimElement.color.r, bimElement.color.g, bimElement.color.b);
                if (bimElement.color.a < 255) {
                    material.opacity = bimElement.color.a / 255.0;
                    UpdateMaterialTransparency (material);
                }
                materialIndex = this.model.AddMaterial (material);
                this.colorToMaterialIndex.set (colorKey, materialIndex);
            }
        }

        let rootNode = this.model.GetRootNode ();

        let bimMesh = this.meshIdToMesh.get (bimElement.mesh_id);
        let mesh = this.ImportMesh (bimMesh, materialIndex);
        let meshIndex = this.model.AddMesh (mesh);

        let elementNode = new Node ();
        elementNode.SetType (NodeType.MeshNode);
        elementNode.AddMeshIndex (meshIndex);

        let translation = new Coord3D (0.0, 0.0, 0.0);
        if (bimElement.vector) {
            translation = new Coord3D (
                bimElement.vector.x,
                bimElement.vector.y,
                bimElement.vector.z
            );
        }
        let rotation = new Quaternion (0.0, 0.0, 0.0, 1.0);
        if (bimElement.rotation) {
            rotation = new Quaternion (
                bimElement.rotation.qx,
                bimElement.rotation.qy,
                bimElement.rotation.qz,
                bimElement.rotation.qw
            );
        }
        let scale = new Coord3D (1.0, 1.0, 1.0);
        let matrix = new Matrix ().ComposeTRS (translation, rotation, scale);
        elementNode.SetTransformation (new Transformation (matrix));

        rootNode.AddChildNode (elementNode);
        return mesh;
    }

    ImportMesh (bimMesh, materialIndex)
    {
        let mesh = new Mesh ();

        for (let i = 0; i < bimMesh.coordinates.length; i += 3) {
            mesh.AddVertex (new Coord3D (
                bimMesh.coordinates[i + 0],
                bimMesh.coordinates[i + 1],
                bimMesh.coordinates[i + 2]
            ));
        }

        for (let i = 0; i < bimMesh.indices.length; i += 3) {
            let triangle = new Triangle (
                bimMesh.indices[i + 0],
                bimMesh.indices[i + 1],
                bimMesh.indices[i + 2]
            );
            if (materialIndex !== null) {
                triangle.SetMaterial (materialIndex);
            }
            mesh.AddTriangle (triangle);
        }

        return mesh;
    }

    ImportProperties (source, target)
    {
        function AddProperty (group, name, value)
        {
            if (value === undefined || value === null) {
                return;
            }
            let property = new Property (PropertyType.Text, name, value);
            group.AddProperty (property);
        }

        if (!source.info) {
            return;
        }

        let info = source.info;
        let propertyGroup = new PropertyGroup ('Info');
        AddProperty (propertyGroup, 'Guid', source.guid);
        AddProperty (propertyGroup, 'Type', source.type);
        for (let propertyName in info) {
            if (Object.prototype.hasOwnProperty.call (info, propertyName)) {
                if (typeof info[propertyName] === 'string') {
                    AddProperty (propertyGroup, propertyName, info[propertyName]);
                }
            }
        }
        target.AddPropertyGroup (propertyGroup);
    }
}
