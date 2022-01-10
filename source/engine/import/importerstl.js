import { Coord3D } from '../geometry/coord3d.js';
import { Direction, IsPositive } from '../geometry/geometry.js';
import { BinaryReader } from '../io/binaryreader.js';
import { ArrayBufferToUtf8String } from '../io/bufferutils.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { NameFromLine, ParametersFromLine, ReadLines } from './importerutils.js';

export class ImporterStl extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'stl';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

    ClearContent ()
    {
        this.mesh = null;
        this.triangle = null;
    }

    ResetContent ()
    {
        this.mesh = new Mesh ();
        this.model.AddMeshToRootNode (this.mesh);
        this.triangle = null;
    }

    ImportContent (fileContent, onFinish)
    {
        if (this.IsBinaryStlFile (fileContent)) {
            this.ProcessBinary (fileContent);
        } else {
            let textContent = ArrayBufferToUtf8String (fileContent);
            ReadLines (textContent, (line) => {
                if (!this.WasError ()) {
                    this.ProcessLine (line);
                }
            });
        }
        onFinish ();
    }

    IsBinaryStlFile (fileContent)
    {
        let byteLength = fileContent.byteLength;
        if (byteLength < 84) {
            return false;
        }

        let reader = new BinaryReader (fileContent, true);
        reader.Skip (80);

        let triangleCount = reader.ReadUnsignedInteger32 ();
        if (byteLength !== triangleCount * 50 + 84) {
            return false;
        }

        return true;
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

        let keyword = parameters[0];
        if (keyword === 'solid') {
            if (parameters.length > 1) {
                let name = NameFromLine (line, keyword.length, '#');
                this.mesh.SetName (name);
            }
            return;
        }

        if (keyword === 'facet') {
            this.triangle = new Triangle (-1, -1, -1);
            if (parameters.length >= 5 && parameters[1] === 'normal') {
                let normalVector = new Coord3D (
                    parseFloat (parameters[2]),
                    parseFloat (parameters[3]),
                    parseFloat (parameters[4])
                );
                if (IsPositive (normalVector.Length ())) {
                    let normalIndex = this.mesh.AddNormal (normalVector);
                    this.triangle.SetNormals (
                        normalIndex,
                        normalIndex,
                        normalIndex
                    );
                }
            }
            return;
        }

        if (keyword === 'vertex' && this.triangle !== null) {
            if (parameters.length >= 4) {
                let vertexIndex = this.mesh.AddVertex (new Coord3D (
                    parseFloat (parameters[1]),
                    parseFloat (parameters[2]),
                    parseFloat (parameters[3])
                ));
                if (this.triangle.v0 === -1) {
                    this.triangle.v0 = vertexIndex;
                } else if (this.triangle.v1 === -1) {
                    this.triangle.v1 = vertexIndex;
                } else if (this.triangle.v2 === -1) {
                    this.triangle.v2 = vertexIndex;
                }
            }
            return;
        }

        if (keyword === 'endfacet' && this.triangle !== null) {
            if (this.triangle.v0 !== -1 && this.triangle.v1 !== -1 && this.triangle.v2 !== null) {
                this.mesh.AddTriangle (this.triangle);
            }
            this.triangle = null;
            return;
        }
    }

    ProcessBinary (fileContent)
    {
        function ReadVector (reader)
        {
            let coord = new Coord3D ();
            coord.x = reader.ReadFloat32 ();
            coord.y = reader.ReadFloat32 ();
            coord.z = reader.ReadFloat32 ();
            return coord;
        }

        function AddVertex (mesh, reader)
        {
            let coord = ReadVector (reader);
            return mesh.AddVertex (coord);
        }

        let reader = new BinaryReader (fileContent, true);
        reader.Skip (80);
        let triangleCount = reader.ReadUnsignedInteger32 ();
        for (let i = 0; i < triangleCount; i++) {
            let normalVector = ReadVector (reader);
            let v0 = AddVertex (this.mesh, reader);
            let v1 = AddVertex (this.mesh, reader);
            let v2 = AddVertex (this.mesh, reader);
            reader.Skip (2);
            let triangle = new Triangle (v0, v1, v2);
            if (IsPositive (normalVector.Length ())) {
                let normal = this.mesh.AddNormal (normalVector);
                triangle.SetNormals (normal, normal, normal);
            }
            this.mesh.AddTriangle (triangle);
        }
    }
}
