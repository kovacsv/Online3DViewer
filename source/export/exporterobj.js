OV.ExporterObj = class extends OV.ExporterBase
{
    constructor ()
    {
        super ();
    }

    CanExport (format, extension)
    {
        return format === OV.FileFormat.Text && extension === 'obj';
    }
    
    ExportContent (model, format, files, onFinish)
    {
        function WriteTexture (mtlWriter, keyword, texture, files)
        {
            if (texture === null || !texture.IsValid ()) {
                return;
            }
            let fileName = OV.GetFileName (texture.name);
            mtlWriter.WriteArrayLine ([keyword, fileName]);

            let fileIndex = files.findIndex ((file) => {
                return file.GetName () === fileName;
            });
            if (fileIndex === -1) {
                let textureFile = new OV.ExportedFile (fileName);
                textureFile.SetContent (texture.buffer);
                files.push (textureFile);
            }
        }

        let mtlFile = new OV.ExportedFile ('model.mtl');
        let objFile = new OV.ExportedFile ('model.obj');

        files.push (mtlFile);
        files.push (objFile);

        let mtlWriter = new OV.TextWriter ();
        mtlWriter.WriteLine (this.GetHeaderText ());
        for (let materialIndex = 0; materialIndex < model.MaterialCount (); materialIndex++) {
            let material = model.GetMaterial (materialIndex);
            mtlWriter.WriteArrayLine (['newmtl', this.GetExportedMaterialName (material.name)]);
            mtlWriter.WriteArrayLine (['Ka', material.ambient.r / 255.0, material.ambient.g / 255.0, material.ambient.b / 255.0]);
            mtlWriter.WriteArrayLine (['Kd', material.color.r / 255.0, material.color.g / 255.0, material.color.b / 255.0]);
            mtlWriter.WriteArrayLine (['Ks', material.specular.r / 255.0, material.specular.g / 255.0, material.specular.b / 255.0]);
            mtlWriter.WriteArrayLine (['Ns', material.shininess * 1000.0]);
            mtlWriter.WriteArrayLine (['d', material.opacity]);
            WriteTexture (mtlWriter, 'map_Kd', material.diffuseMap, files);
            WriteTexture (mtlWriter, 'map_Ks', material.specularMap, files);
            WriteTexture (mtlWriter, 'bump', material.bumpMap, files);
        }
        mtlFile.SetContent (mtlWriter.GetText ());

        let objWriter = new OV.TextWriter ();
        objWriter.WriteLine (this.GetHeaderText ());
        objWriter.WriteArrayLine (['mtllib', mtlFile.GetName ()]);
        let vertexOffset = 0;
        let normalOffset = 0;
        let uvOffset = 0;
        let usedMaterialName = null;
        for (let meshIndex = 0; meshIndex < model.MeshCount (); meshIndex++) {
            let mesh = model.GetMesh (meshIndex);
            objWriter.WriteArrayLine (['g', this.GetExportedMeshName (mesh.GetName ())]);
            for (let vertexIndex = 0; vertexIndex < mesh.VertexCount (); vertexIndex++) {
                let vertex = mesh.GetVertex (vertexIndex);
                objWriter.WriteArrayLine (['v', vertex.x, vertex.y, vertex.z]);
            }
            for (let normalIndex = 0; normalIndex < mesh.NormalCount (); normalIndex++) {
                let normal = mesh.GetNormal (normalIndex);
                objWriter.WriteArrayLine (['vn', normal.x, normal.y, normal.z]);
            }
            for (let textureUVIndex = 0; textureUVIndex < mesh.TextureUVCount (); textureUVIndex++) {
                let uv = mesh.GetTextureUV (textureUVIndex);
                objWriter.WriteArrayLine (['vt', uv.x, uv.y]);
            }
            for (let triangleIndex = 0; triangleIndex < mesh.TriangleCount (); triangleIndex++) {
                let triangle = mesh.GetTriangle (triangleIndex);
                let v0 = triangle.v0 + vertexOffset + 1;
                let v1 = triangle.v1 + vertexOffset + 1;
                let v2 = triangle.v2 + vertexOffset + 1;
                let n0 = triangle.n0 + normalOffset + 1;
                let n1 = triangle.n1 + normalOffset + 1;
                let n2 = triangle.n2 + normalOffset + 1;
                if (triangle.mat !== null) {
                    let material = model.GetMaterial (triangle.mat);
                    let materialName = this.GetExportedMaterialName (material.name);
                    if (materialName !== usedMaterialName) {
                        objWriter.WriteArrayLine (['usemtl', materialName]);
                        usedMaterialName = materialName;
                    }
                }
                let u0 = '';
                let u1 = '';
                let u2 = '';
                if (triangle.HasTextureUVs ()) {
                    u0 = triangle.u0 + uvOffset + 1;
                    u1 = triangle.u1 + uvOffset + 1;
                    u2 = triangle.u2 + uvOffset + 1;                    
                }
                objWriter.WriteArrayLine (['f', [v0, u0, n0].join ('/'), [v1, u1, n1].join ('/'), [v2, u2, n2].join ('/')]);
            }
            vertexOffset += mesh.VertexCount ();
            normalOffset += mesh.NormalCount ();
            uvOffset += mesh.TextureUVCount ();
        }

        objFile.SetContent (objWriter.GetText ());
        onFinish ();  
    }

    GetHeaderText ()
    {
        return '# exported by https://3dviewer.net';
    }    
};
