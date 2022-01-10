import { Coord2D } from '../geometry/coord2d.js';
import { Coord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { ArrayBufferToUtf8String } from '../io/bufferutils.js';
import { ColorFromFloatComponents } from '../model/color.js';
import { PhongMaterial, TextureMap } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { NameFromLine, ParametersFromLine, ReadLines, UpdateMaterialTransparency } from './importerutils.js';

export class ObjMeshConverter
{
    constructor (mesh)
    {
        this.mesh = mesh;
        this.globalToMeshVertices = new Map ();
        this.globalToMeshNormals = new Map ();
        this.globalToMeshUvs = new Map ();
    }

    AddVertex (globalIndex, globalVertices)
    {
        return this.GetLocalIndex (globalIndex, globalVertices, this.globalToMeshVertices, (val) => {
            return this.mesh.AddVertex (new Coord3D (val.x, val.y, val.z));
        });
    }

    AddNormal (globalIndex, globalNormals)
    {
        return this.GetLocalIndex (globalIndex, globalNormals, this.globalToMeshNormals, (val) => {
            return this.mesh.AddNormal (new Coord3D (val.x, val.y, val.z));
        });
    }

    AddUV (globalIndex, globalUvs)
    {
        return this.GetLocalIndex (globalIndex, globalUvs, this.globalToMeshUvs, (val) => {
            return this.mesh.AddTextureUV (new Coord2D (val.x, val.y));
        });
    }

    AddTriangle (triangle)
    {
        this.mesh.AddTriangle (triangle);
    }

    GetLocalIndex (globalIndex, globalValueArray, globalToMeshIndices, valueAdderFunc)
    {
        if (isNaN (globalIndex) || globalIndex < 0 || globalIndex >= globalValueArray.length) {
            return null;
        }
        if (globalToMeshIndices.has (globalIndex)) {
            return globalToMeshIndices.get (globalIndex);
        } else {
            let globalValue = globalValueArray[globalIndex];
            let localIndex = valueAdderFunc (globalValue);
            globalToMeshIndices.set (globalIndex, localIndex);
            return localIndex;
        }
    }
}

export class ImporterObj extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'obj';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    ClearContent ()
    {
        this.globalVertices = null;
        this.globalNormals = null;
        this.globalUvs = null;

        this.currentMeshConverter = null;
        this.currentMaterial = null;
        this.currentMaterialIndex = null;

        this.meshNameToConverter = null;
        this.materialNameToIndex = null;
    }

    ResetContent ()
    {
        this.globalVertices = [];
        this.globalNormals = [];
        this.globalUvs = [];

        this.currentMeshConverter = null;
        this.currentMaterial = null;
        this.currentMaterialIndex = null;

        this.meshNameToConverter = new Map ();
        this.materialNameToIndex = new Map ();
    }

    ImportContent (fileContent, onFinish)
    {
        let textContent = ArrayBufferToUtf8String (fileContent);
        ReadLines (textContent, (line) => {
            if (!this.WasError ()) {
                this.ProcessLine (line);
            }
        });
        onFinish ();
    }

    ProcessLine (line)
    {
        if (line[0] === '#') {
            return;
        }

        let parameters = ParametersFromLine (line, '#');
        if (parameters.length === 0) {
            return;
        }

        let keyword = parameters[0].toLowerCase ();
        parameters.shift ();

        if (this.ProcessMeshParameter (keyword, parameters, line)) {
            return;
        }

        if (this.ProcessMaterialParameter (keyword, parameters, line)) {
            return;
        }
    }

    AddNewMesh (name)
    {
        if (this.meshNameToConverter.has (name)) {
            this.currentMeshConverter = this.meshNameToConverter.get (name);
        } else {
            let mesh = new Mesh ();
            mesh.SetName (name);
            this.model.AddMeshToRootNode (mesh);
            this.currentMeshConverter = new ObjMeshConverter (mesh);
            this.meshNameToConverter.set (name, this.currentMeshConverter);
        }
    }

    ProcessMeshParameter (keyword, parameters, line)
    {
        if (keyword === 'g' || keyword === 'o') {
            if (parameters.length === 0) {
                return true;
            }
            let name = NameFromLine (line, keyword.length, '#');
            this.AddNewMesh (name);
            return true;
        } else if (keyword === 'v') {
            if (parameters.length < 3) {
                return true;
            }
            this.globalVertices.push (new Coord3D (
                parseFloat (parameters[0]),
                parseFloat (parameters[1]),
                parseFloat (parameters[2])
            ));
            return true;
        } else if (keyword === 'vn') {
            if (parameters.length < 3) {
                return true;
            }
            this.globalNormals.push (new Coord3D (
                parseFloat (parameters[0]),
                parseFloat (parameters[1]),
                parseFloat (parameters[2])
            ));
            return true;
        } else if (keyword === 'vt') {
            if (parameters.length < 2) {
                return true;
            }
            this.globalUvs.push (new Coord2D (
                parseFloat (parameters[0]),
                parseFloat (parameters[1])
            ));
            return true;
        } else if (keyword === 'f') {
            if (parameters.length < 3) {
                return true;
            }
            this.ProcessFace (parameters);
            return true;
        }

        return false;
    }

    ProcessMaterialParameter (keyword, parameters, line)
    {
        function CreateTexture (keyword, line, callbacks)
        {
            let texture = new TextureMap ();
            let textureName = NameFromLine (line, keyword.length, '#');
            let textureBuffer = callbacks.getTextureBuffer (textureName);
            texture.name = textureName;
            if (textureBuffer !== null) {
                texture.url = textureBuffer.url;
                texture.buffer = textureBuffer.buffer;
            }
            return texture;
        }

        if (keyword === 'newmtl') {
            if (parameters.length === 0) {
                return true;
            }

            let material = new PhongMaterial ();
            let materialName = NameFromLine (line, keyword.length, '#');
            let materialIndex = this.model.AddMaterial (material);
            material.name = materialName;
            this.currentMaterial = material;
            this.materialNameToIndex.set (materialName, materialIndex);
            return true;
        } else if (keyword === 'usemtl') {
            if (parameters.length === 0) {
                return true;
            }

            let materialName = NameFromLine (line, keyword.length, '#');
            if (this.materialNameToIndex.has (materialName)) {
                this.currentMaterialIndex = this.materialNameToIndex.get (materialName);
            }
            return true;
        } else if (keyword === 'mtllib') {
            if (parameters.length === 0) {
                return true;
            }
            let fileName = NameFromLine (line, keyword.length, '#');
            let fileBuffer = this.callbacks.getFileBuffer (fileName);
            if (fileBuffer !== null) {
                let textContent = ArrayBufferToUtf8String (fileBuffer);
                ReadLines (textContent, (line) => {
                    if (!this.WasError ()) {
                        this.ProcessLine (line);
                    }
                });
            }
            return true;
        } else if (keyword === 'map_kd') {
            if (this.currentMaterial === null || parameters.length === 0) {
                return true;
            }
            this.currentMaterial.diffuseMap = CreateTexture (keyword, line, this.callbacks);
            UpdateMaterialTransparency (this.currentMaterial);
            return true;
        } else if (keyword === 'map_ks') {
            if (this.currentMaterial === null || parameters.length === 0) {
                return true;
            }
            this.currentMaterial.specularMap = CreateTexture (keyword, line, this.callbacks);
            return true;
        } else if (keyword === 'map_bump' || keyword === 'bump') {
            if (this.currentMaterial === null || parameters.length === 0) {
                return true;
            }
            this.currentMaterial.bumpMap = CreateTexture (keyword, line, this.callbacks);
            return true;
        } else if (keyword === 'ka') {
            if (this.currentMaterial === null || parameters.length < 3) {
                return true;
            }
            this.currentMaterial.ambient = ColorFromFloatComponents (parameters[0], parameters[1], parameters[2]);
            return true;
        } else if (keyword === 'kd') {
            if (this.currentMaterial === null || parameters.length < 3) {
                return true;
            }
            this.currentMaterial.color = ColorFromFloatComponents (parameters[0], parameters[1], parameters[2]);
            return true;
        } else if (keyword === 'ks') {
            if (this.currentMaterial === null || parameters.length < 3) {
                return true;
            }
            this.currentMaterial.specular = ColorFromFloatComponents (parameters[0], parameters[1], parameters[2]);
            return true;
        } else if (keyword === 'ns') {
            if (this.currentMaterial === null || parameters.length < 1) {
                return true;
            }
            this.currentMaterial.shininess = parseFloat (parameters[0]) / 1000.0;
            return true;
        } else if (keyword === 'tr') {
            if (this.currentMaterial === null || parameters.length < 1) {
                return true;
            }
            this.currentMaterial.opacity = 1.0 - parseFloat (parameters[0]);
            UpdateMaterialTransparency (this.currentMaterial);
            return true;
        } else if (keyword === 'd') {
            if (this.currentMaterial === null || parameters.length < 1) {
                return true;
            }
            this.currentMaterial.opacity = parseFloat (parameters[0]);
            UpdateMaterialTransparency (this.currentMaterial);
            return true;
        }

        return false;
    }

    ProcessFace (parameters)
    {
        function GetRelativeIndex (index, count)
        {
            if (index > 0) {
                return index - 1;
            } else {
                return count + index;
            }
        }

        let vertices = [];
        let normals = [];
        let uvs = [];

        for (let i = 0; i < parameters.length; i++) {
            let vertexParams = parameters[i].split ('/');
            vertices.push (GetRelativeIndex (parseInt (vertexParams[0], 10), this.globalVertices.length));
            if (vertexParams.length > 1 && vertexParams[1].length > 0) {
                uvs.push (GetRelativeIndex (parseInt (vertexParams[1], 10), this.globalUvs.length));
            }
            if (vertexParams.length > 2 && vertexParams[2].length > 0) {
                normals.push (GetRelativeIndex (parseInt (vertexParams[2], 10), this.globalNormals.length));
            }
        }

        if (this.currentMeshConverter === null) {
            this.AddNewMesh ('');
        }

        for (let i = 0; i < vertices.length - 2; i++) {
            let v0 = this.currentMeshConverter.AddVertex (vertices[0], this.globalVertices);
            let v1 = this.currentMeshConverter.AddVertex (vertices[i + 1], this.globalVertices);
            let v2 = this.currentMeshConverter.AddVertex (vertices[i + 2], this.globalVertices);
            if (v0 === null || v1 === null || v2 === null) {
                this.SetError ('Invalid vertex index.');
                break;
            }
            let triangle = new Triangle (v0, v1, v2);
            if (normals.length === vertices.length) {
                let n0 = this.currentMeshConverter.AddNormal (normals[0], this.globalNormals);
                let n1 = this.currentMeshConverter.AddNormal (normals[i + 1], this.globalNormals);
                let n2 = this.currentMeshConverter.AddNormal (normals[i + 2], this.globalNormals);
                if (n0 === null || n1 === null || n2 === null) {
                    this.SetError ('Invalid normal index.');
                    break;
                }
                triangle.SetNormals (n0, n1, n2);
            }
            if (uvs.length === vertices.length) {
                let u0 = this.currentMeshConverter.AddUV (uvs[0], this.globalUvs);
                let u1 = this.currentMeshConverter.AddUV (uvs[i + 1], this.globalUvs);
                let u2 = this.currentMeshConverter.AddUV (uvs[i + 2], this.globalUvs);
                if (u0 === null || u1 === null || u2 === null) {
                    this.SetError ('Invalid uv index.');
                    break;
                }
                triangle.SetTextureUVs (u0, u1, u2);
            }
            if (this.currentMaterialIndex !== null) {
                triangle.mat = this.currentMaterialIndex;
            }
            this.currentMeshConverter.AddTriangle (triangle);
        }
    }
}
