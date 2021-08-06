OV.Exporter = class
{
    constructor ()
    {
        this.exporters = [
            new OV.ExporterObj (),
            new OV.ExporterStl (),
            new OV.ExporterPly (),
            new OV.ExporterOff (),
            new OV.ExporterGltf (),
            new OV.Exporter3dm ()
        ];
    }

    AddExporter (exporter)
    {
        this.exporters.push (exporter);
    }

    Export (model, format, extension, callbacks)
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

        exporter.Export (model, format, (files) => {
            if (files.length === 0) {
                callbacks.onError ();
            } else {
                callbacks.onSuccess (files);
            }
        });
    }
};
