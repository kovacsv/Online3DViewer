import { Direction } from '../geometry/geometry.js';
import { GetExternalLibPath } from '../io/externallibs.js';
import { Node } from '../model/node.js';
import { RGBColorFromFloatComponents } from '../model/color.js';
import { ConvertThreeGeometryToMesh } from '../threejs/threeutils.js';
import { ImporterBase } from './importerbase.js';
import { ColorToMaterialConverter } from './importerutils.js';

export class ImporterOcct extends ImporterBase
{
    constructor ()
    {
        super ();
		this.worker = null;
    }

    CanImportExtension (extension)
    {
        return extension === 'stp' || extension === 'step' || extension === 'igs' || extension === 'iges' || extension === 'brp' || extension === 'brep';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

	ClearContent ()
	{
        if (this.worker !== null) {
            this.worker.terminate ();
            this.worker = null;
        }
	}

    ResetContent ()
    {
        this.worker = null;
    }

    ImportContent (fileContent, onFinish)
    {
        let workerPath = GetExternalLibPath ('loaders/occt-import-js-worker.js');
        this.worker = new Worker (workerPath);
        this.worker.addEventListener ('message', (ev) => {
            this.ImportResultJson (ev.data, onFinish);
        });
        this.worker.addEventListener ('error', (ev) => {
            this.SetError ('Failed to load occt-import-js.');
            onFinish ();
        });

        let format = null;
        if (this.extension === 'stp' || this.extension === 'step') {
            format = 'step';
        } else if (this.extension === 'igs' || this.extension === 'iges') {
            format = 'iges';
        } else if (this.extension === 'brp' || this.extension === 'brep') {
            format = 'brep';
        } else {
            onFinish ();
            return;
        }

        let fileBuffer = new Uint8Array (fileContent);
        this.worker.postMessage ({
            format : format,
            buffer : fileBuffer,
            params : null
        });
    }

	ImportResultJson (resultContent, onFinish)
	{
        if (!resultContent.success) {
            onFinish ();
            return;
        }
        let colorToMaterial = new ColorToMaterialConverter (this.model);
        let rootNode = this.model.GetRootNode ();
        this.ImportNode (resultContent, resultContent.root, rootNode, colorToMaterial);
        onFinish ();
	}

    ImportNode (resultContent, occtNode, parentNode, colorToMaterial)
    {
        for (let nodeMeshIndex of occtNode.meshes) {
            let occtMesh = resultContent.meshes[nodeMeshIndex];
            let mesh = this.ImportMesh (occtMesh, colorToMaterial);
            let meshIndex = this.model.AddMesh (mesh);
            parentNode.AddMeshIndex (meshIndex);
        }
        for (let childOcctNode of occtNode.children) {
            let childNode = new Node ();
            childNode.SetName (childOcctNode.name);
            parentNode.AddChildNode (childNode);
            this.ImportNode (resultContent, childOcctNode, childNode, colorToMaterial);
        }
    }

    ImportMesh (occtMesh, colorToMaterial)
    {
        let materialIndex = null;
        if (occtMesh.color) {
            let color = RGBColorFromFloatComponents (occtMesh.color[0], occtMesh.color[1], occtMesh.color[2]);
            materialIndex = colorToMaterial.GetMaterialIndex (color.r, color.g, color.b, null);
        }
        let mesh = ConvertThreeGeometryToMesh (occtMesh, materialIndex);
        if (occtMesh.name) {
            mesh.SetName (occtMesh.name);
        }
        if (occtMesh.face_colors) {
            for (let faceColorGroup of occtMesh.face_colors) {
                let faceColor = RGBColorFromFloatComponents (faceColorGroup.color[0], faceColorGroup.color[1], faceColorGroup.color[2]);
                let faceMaterialIndex = colorToMaterial.GetMaterialIndex (faceColor.r, faceColor.g, faceColor.b, null);
                for (let i = faceColorGroup.first; i <= faceColorGroup.last; i++) {
                    let triangle = mesh.GetTriangle (i);
                    triangle.SetMaterial (faceMaterialIndex);
                }
            }
        }
        return mesh;
    }
}
