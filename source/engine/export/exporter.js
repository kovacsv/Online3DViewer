import { Exporter3dm } from './exporter3dm.js';
import { ExporterGltf } from './exportergltf.js';
import { ExporterModel } from './exportermodel.js';
import { ExporterObj } from './exporterobj.js';
import { ExporterOff } from './exporteroff.js';
import { ExporterPly } from './exporterply.js';
import { ExporterStl } from './exporterstl.js';

export class Exporter
{
    constructor ()
    {
        this.exporters = [
            new ExporterObj (),
            new ExporterStl (),
            new ExporterPly (),
            new ExporterOff (),
            new ExporterGltf (),
            new Exporter3dm ()
        ];
    }

    AddExporter (exporter)
    {
        this.exporters.push (exporter);
    }

    Export (model, settings, format, extension, callbacks)
    {
        let exporter = null;
        for (let i = 0; i < this.exporters.length; i++) {
            let currentExporter = this.exporters[i];
            if (currentExporter.CanExport (format, extension)) {
                exporter = currentExporter;
                break;
            }
        }
        if (exporter === null) {
            callbacks.onError ();
            return;
        }

        let exporterModel = new ExporterModel (model, settings);
        exporter.Export (exporterModel, format, (files) => {
            if (files.length === 0) {
                callbacks.onError ();
            } else {
                callbacks.onSuccess (files);
            }
        });
    }
}
