import { Coord3D } from '../geometry/coord3d.js';
import { Direction } from '../geometry/geometry.js';
import { ArrayBufferToUtf8String } from '../io/bufferutils.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';
import { ImporterBase } from './importerbase.js';
import { ParametersFromLine, ReadLines } from './importerutils.js';

export class ImporterOff extends ImporterBase
{
    constructor ()
    {
        super ();
    }

    CanImportExtension (extension)
    {
        return extension === 'off';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

    ClearContent ()
    {
        this.mesh = null;
        this.status = null;
    }

    ResetContent ()
    {
        this.mesh = new Mesh ();
        this.model.AddMeshToRootNode (this.mesh);
        this.status = {
            vertexCount : 0,
            faceCount : 0,
            foundVertex : 0,
            foundFace : 0
        };
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

        if (parameters[0] === 'OFF') {
            return;
        }

        if (this.status.vertexCount === 0 && this.status.faceCount === 0) {
            if (parameters.length > 1) {
                this.status.vertexCount = parseInt (parameters[0], 10);
                this.status.faceCount = parseInt (parameters[1], 10);
            }
            return;
        }

        if (this.status.foundVertex < this.status.vertexCount) {
            if (parameters.length >= 3) {
                this.mesh.AddVertex (new Coord3D (
                    parseFloat (parameters[0]),
                    parseFloat (parameters[1]),
                    parseFloat (parameters[2])
                ));
                this.status.foundVertex += 1;
            }
            return;
        }

        if (this.status.foundFace < this.status.faceCount) {
            if (parameters.length >= 4) {
                let vertexCount = parseInt (parameters[0], 10);
                if (parameters.length < vertexCount + 1) {
                    return;
                }
                for (let i = 0; i < vertexCount - 2; i++) {
                    let v0 = parseInt (parameters[1]);
                    let v1 = parseInt (parameters[i + 2]);
                    let v2 = parseInt (parameters[i + 3]);
                    let triangle = new Triangle (v0, v1, v2);
                    this.mesh.AddTriangle (triangle);
                }
                this.status.foundFace += 1;
            }
            return;
        }
    }
}
