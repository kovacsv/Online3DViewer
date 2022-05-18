import { Direction } from '../geometry/geometry.js';
import { GetExternalLibPath } from '../io/externallibs.js';
import { Node } from '../model/node.js';
import { ColorFromFloatComponents, ColorToHexString } from '../model/color.js';
import { PhongMaterial } from '../model/material.js';
import { ConvertThreeGeometryToMesh } from '../threejs/threeutils.js';
import { ImporterBase } from './importerbase.js';
import { ColorToMaterialConverter } from './importerutils.js';

export class ImporterStp extends ImporterBase
{
    constructor ()
    {
        super ();
		this.worker = null;
    }

    CanImportExtension (extension)
    {
        return extension === 'stp' || extension === 'step';
    }

    GetUpDirection ()
    {
        return Direction.Y;
    }

	ClearContent ()
	{

	}

    ResetContent ()
    {

    }

    ImportContent (fileContent, onFinish)
    {
        if (this.worker === null) {
            let workerPath = GetExternalLibPath ('loaders/occt-import-js-worker.js');
            this.worker = new Worker (workerPath);
        }

        let onModelConverted = (ev) => {
            this.ImportStepContent (ev.data, onFinish);
            this.worker.removeEventListener ('message', onModelConverted);
        };

        this.worker.addEventListener ('message', onModelConverted);
        this.worker.addEventListener ('error', (ev) => {
            this.worker = null;
            this.SetError ('Failed to load occt-import-js.');
            onFinish ();
        });

        let fileBuffer = new Uint8Array (fileContent);
        this.worker.postMessage (fileBuffer);
    }

	ImportStepContent (stepContent, onFinish)
	{
        if (!stepContent.success) {
            return;
        }
        let colorToMaterial = new ColorToMaterialConverter ((color) => {
            let material = new PhongMaterial ();
            material.name = ColorToHexString (color).toUpperCase ();
            material.color = color;
            return this.model.AddMaterial (material);
        });
        let rootNode = this.model.GetRootNode ();
        this.ImportNode (stepContent, stepContent.root, rootNode, colorToMaterial);
        onFinish ();
	}

    ImportNode (stepContent, occtNode, parentNode, colorToMaterial)
    {
        for (let nodeMeshIndex of occtNode.meshes) {
            let occtMesh = stepContent.meshes[nodeMeshIndex];
            let mesh = this.ImportMesh (occtMesh, colorToMaterial);
            let meshIndex = this.model.AddMesh (mesh);
            parentNode.AddMeshIndex (meshIndex);
        }
        for (let childOcctNode of occtNode.children) {
            let childNode = new Node ();
            childNode.SetName (childOcctNode.name);
            parentNode.AddChildNode (childNode);
            this.ImportNode (stepContent, childOcctNode, childNode, colorToMaterial);
        }
    }

    ImportMesh (occtMesh, colorToMaterial)
    {
        let materialIndex = null;
        if (occtMesh.color) {
            let color = ColorFromFloatComponents (occtMesh.color[0], occtMesh.color[1], occtMesh.color[2]);
            materialIndex = colorToMaterial.GetMaterialIndex (color);
        }
        let mesh = ConvertThreeGeometryToMesh (occtMesh, materialIndex);
        if (occtMesh.name) {
            mesh.SetName (occtMesh.name);
        }
        if (occtMesh.face_colors) {
            for (let faceColorGroup of occtMesh.face_colors) {
                let faceColor = ColorFromFloatComponents (faceColorGroup.color[0], faceColorGroup.color[1], faceColorGroup.color[2]);
                let faceMaterialIndex = colorToMaterial.GetMaterialIndex (faceColor);
                for (let i = faceColorGroup.first; i <= faceColorGroup.last; i++) {
                    let triangle = mesh.GetTriangle (i);
                    triangle.SetMaterial (faceMaterialIndex);
                }
            }
        }
        return mesh;
    }
}
