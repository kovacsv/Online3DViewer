OV.ImporterO3dv = class extends OV.ImporterBase
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
        return OV.Direction.Z;
    }

    ClearContent ()
    {

    }

    ResetContent ()
    {

    }

    ImportContent (fileContent, onFinish)
    {
        let textContent = OV.ArrayBufferToUtf8String (fileContent);
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
        let material = new OV.Material (OV.MaterialType.Physical);
        material.color.Set (255, 255, 255);
        if (materialContent.name !== undefined) {
            material.name = materialContent.name;
        }
        if (materialContent.color !== undefined) {
            material.color = OV.ArrayToColor (materialContent.color);
        }
        material.metalness = OV.ValueOrDefault (materialContent.metalness, 0.0);
        material.roughness = OV.ValueOrDefault (materialContent.roughness, 1.0);
        this.model.AddMaterial (material);
    }

    ImportMesh (meshContent)
    {
        let genParams = new OV.GeneratorParams ();
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
            mesh = OV.GenerateCuboid (genParams, parameters.size_x, parameters.size_y, parameters.size_z);
        } else if (meshContent.type === 'cylinder') {
            if (parameters.radius === undefined || parameters.height === undefined) {
                return;
            }
            let segments = OV.ValueOrDefault (parameters.segments, 25);
            let smooth = OV.ValueOrDefault (parameters.smooth, true);
            mesh = OV.GenerateCylinder (genParams, parameters.radius, parameters.height, segments, smooth);
        } else if (meshContent.type === 'sphere') {
            if (parameters.radius === undefined) {
                return;
            }
            let segments = OV.ValueOrDefault (parameters.segments, 20);
            let smooth = OV.ValueOrDefault (parameters.smooth, true);
            mesh = OV.GenerateSphere (genParams, parameters.radius, segments, smooth);
        } else if (meshContent.type === 'platonic') {
            if (parameters.solid_type === undefined) {
                return;
            }
            let radius = OV.ValueOrDefault (parameters.radius, 1.0);
            mesh = OV.GeneratePlatonicSolid (genParams, parameters.solid_type, radius);
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
                let childNode = new OV.Node ();
                node.AddChildNode (childNode);
                this.ImportNode (content, childContent, childNode);
            }
        }
        if (nodeContent.mesh !== undefined) {
            if (nodeContent.children === undefined || nodeContent.children.length === 0) {
                node.SetType (OV.NodeType.MeshNode);
            }
            node.AddMeshIndex (nodeContent.mesh);
        }
    }

    ImportProperties (element, nodeContent)
    {
        if (nodeContent.properties !== undefined) {
            const propertyGroup = new OV.PropertyGroup ('Properties');
            element.AddPropertyGroup (propertyGroup);
            for (const nodeProperty of nodeContent.properties) {
                const property = new OV.Property (OV.PropertyType.Text, nodeProperty.name, nodeProperty.value);
                propertyGroup.AddProperty (property);
            }
        }
    }

    GetTransformation (contentTransformation)
    {
        let translation = new OV.Coord3D (0.0, 0.0, 0.0);
        let rotation = new OV.Quaternion (0.0, 0.0, 0.0, 1.0);
        let scale = new OV.Coord3D (1.0, 1.0, 1.0);
        if (contentTransformation.translation !== undefined) {
            translation = OV.ArrayToCoord3D (contentTransformation.translation);
        }
        if (contentTransformation.rotation !== undefined) {
            rotation = OV.ArrayToQuaternion (contentTransformation.rotation);
        }
        if (contentTransformation.scale !== undefined) {
            scale = OV.ArrayToCoord3D (contentTransformation.scale);
        }
        const matrix = new OV.Matrix ().ComposeTRS (translation, rotation, scale);
        return new OV.Transformation (matrix);
    }
};
