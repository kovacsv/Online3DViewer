import { Direction } from '../geometry/geometry.js';
import { GetExternalLibPath } from '../io/externallibs.js';
import { ConvertThreeGeometryToMesh } from '../threejs/threeutils.js';
import { ImporterBase } from './importerbase.js';

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
            let workerPath = GetExternalLibPath ('loaders/occt-import-js-worker-cdn.js');
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
        console.log (stepContent);
        for (let occtMesh of stepContent.meshes) {
            let mesh = ConvertThreeGeometryToMesh (occtMesh, null);
            this.model.AddMeshToRootNode (mesh);
        }
        onFinish ();
	}
}
