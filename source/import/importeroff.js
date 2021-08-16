OV.ImporterOff = class extends OV.ImporterBase
{
    constructor ()
    {
        super ();
    }
    
    CanImportExtension (extension)
    {
        return extension === 'off';
    }
    
    GetKnownFileFormats ()
    {
        return {
            'off' : OV.FileFormat.Text
        };
    }
    
    GetUpDirection ()
    {
        return OV.Direction.Y;
    }
    
    ClearContent ()
    {
        this.mesh = null;
        this.status = null;
    }

    ResetContent ()
    {
        this.mesh = new OV.Mesh ();
        this.model.AddMesh (this.mesh);
        this.status = {
            vertexCount : 0,
            faceCount : 0,
            foundVertex : 0,
            foundFace : 0
        };
    }

    ImportContent (fileContent, onFinish)
    {
        OV.ReadLines (fileContent, (line) => {
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

        let parameters = OV.ParametersFromLine (line, '#');
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
                this.mesh.AddVertex (new OV.Coord3D (
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
                    let triangle = new OV.Triangle (v0, v1, v2);
                    this.mesh.AddTriangle (triangle);
                }
                this.status.foundFace += 1;
            }
            return;
        }
    }
};
