import { ValueOrDefault } from '../core/core.js';
import { ArrayToCoord3D, Coord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { ArrayToQuaternion, Quaternion } from '../geometry/quaternion.js';
import { Transformation } from '../geometry/transformation.js';
import { ArrayBufferToUtf8String } from '../io/bufferutils.js';
import { ArrayToColor } from '../model/color.js';
import { GenerateCuboid, GenerateCylinder, GeneratePlatonicSolid, GenerateSphere, GeneratorParams } from '../model/generator.js';
import { PhysicalMaterial } from '../model/material.js';
import { Node, NodeType } from '../model/node.js';
import { Property, PropertyGroup, PropertyType } from '../model/property.js';
import { ImporterBase } from './importerbase.js';

export class ImporterO3dv extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'o3dv';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    ClearContent ()
    {

    }

    ResetContent ()
    {

    }

    ImportContent (fileContent, onFinish)
    {
        let textContent = ArrayBufferToUtf8String (fileContent);
        let content = JSON.parse (textContent);
        if (content.root === undefined) {
            onFinish ();
            return;
        }

        if (content.materials !== undefined) {
            for (let i = 0; i < content.materials.length; i++) {
                const materialContent = content.materials[i];
                this.ImportMaterial (materialContent);
            }
        }
        if (content.meshes !== undefined) {
            for (let i = 0; i < content.meshes.length; i++) {
                const meshContent = content.meshes[i];
                this.ImportMesh (meshContent);
            }
        }

        let rootNode = content.nodes[content.root];
        this.ImportNode (content, rootNode, this.model.GetRootNode ());
        this.ImportProperties (this.model, content);

        onFinish ();
    }

    ImportMaterial (materialContent)
    {
        let material = new PhysicalMaterial ();
        material.color.Set (255, 255, 255);
        if (materialContent.name !== undefined) {
            material.name = materialContent.name;
        }
        if (materialContent.color !== undefined) {
            material.color = ArrayToColor (materialContent.color);
        }
        material.metalness = ValueOrDefault (materialContent.metalness, 0.0);
        material.roughness = ValueOrDefault (materialContent.roughness, 1.0);
        this.model.AddMaterial (material);
    }

    ImportMesh (meshContent)
    {
        let genParams = new GeneratorParams ();
        if (meshContent.name !== undefined) {
            genParams.SetName (meshContent.name);
        }
        if (meshContent.material !== undefined) {
            genParams.SetMaterial (meshContent.material);
        }

        let parameters = meshContent.parameters;
        if (parameters === undefined) {
            return;
        }

        let mesh = null;
        if (meshContent.type === 'cuboid') {
            if (parameters.size_x === undefined || parameters.size_y === undefined || parameters.size_z === undefined) {
                return;
            }
            mesh = GenerateCuboid (genParams, parameters.size_x, parameters.size_y, parameters.size_z);
        } else if (meshContent.type === 'cylinder') {
            if (parameters.radius === undefined || parameters.height === undefined) {
                return;
            }
            let segments = ValueOrDefault (parameters.segments, 25);
            let smooth = ValueOrDefault (parameters.smooth, true);
            mesh = GenerateCylinder (genParams, parameters.radius, parameters.height, segments, smooth);
        } else if (meshContent.type === 'sphere') {
            if (parameters.radius === undefined) {
                return;
            }
            let segments = ValueOrDefault (parameters.segments, 20);
            let smooth = ValueOrDefault (parameters.smooth, true);
            mesh = GenerateSphere (genParams, parameters.radius, segments, smooth);
        } else if (meshContent.type === 'platonic') {
            if (parameters.solid_type === undefined) {
                return;
            }
            let radius = ValueOrDefault (parameters.radius, 1.0);
            mesh = GeneratePlatonicSolid (genParams, parameters.solid_type, radius);
        }
        if (mesh !== null) {
            this.ImportProperties (mesh, meshContent);
            this.model.AddMesh (mesh);
        }
    }

    ImportNode (content, nodeContent, node)
    {
        if (nodeContent.name !== undefined) {
            node.SetName (nodeContent.name);
        }
        if (nodeContent.transformation !== undefined) {
            const nodeTransformation = this.GetTransformation (nodeContent.transformation);
            node.SetTransformation (nodeTransformation);
        }
        if (nodeContent.children !== undefined) {
            for (const childIndex of nodeContent.children) {
                let childContent = content.nodes[childIndex];
                let childNode = new Node ();
                node.AddChildNode (childNode);
                this.ImportNode (content, childContent, childNode);
            }
        }
        if (nodeContent.mesh !== undefined) {
            if (nodeContent.children === undefined || nodeContent.children.length === 0) {
                node.SetType (NodeType.MeshNode);
            }
            node.AddMeshIndex (nodeContent.mesh);
        }
    }

    ImportProperties (element, nodeContent)
    {
        if (nodeContent.properties !== undefined) {
            const propertyGroup = new PropertyGroup ('Properties');
            element.AddPropertyGroup (propertyGroup);
            for (const nodeProperty of nodeContent.properties) {
                const property = new Property (PropertyType.Text, nodeProperty.name, nodeProperty.value);
                propertyGroup.AddProperty (property);
            }
        }
    }

    GetTransformation (contentTransformation)
    {
        let translation = new Coord3D (0.0, 0.0, 0.0);
        let rotation = new Quaternion (0.0, 0.0, 0.0, 1.0);
        let scale = new Coord3D (1.0, 1.0, 1.0);
        if (contentTransformation.translation !== undefined) {
            translation = ArrayToCoord3D (contentTransformation.translation);
        }
        if (contentTransformation.rotation !== undefined) {
            rotation = ArrayToQuaternion (contentTransformation.rotation);
        }
        if (contentTransformation.scale !== undefined) {
            scale = ArrayToCoord3D (contentTransformation.scale);
        }
        const matrix = new Matrix ().ComposeTRS (translation, rotation, scale);
        return new Transformation (matrix);
    }
}
