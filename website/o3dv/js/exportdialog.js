OV.ExportType =
{
    Model : 0,
    Image : 1
};

OV.ExporterUI = class
{
    constructor (name)
    {
        this.name = name;
    }

    GetType ()
    {
        return null;
    }

    GetName ()
    {
        return this.name;
    }

    GenerateParametersUI (parametersDiv)
    {

    }

    AddCheckbox (parentDiv, id, name, isChecked)
    {
        let line = OV.AddDiv (parentDiv, 'ov_dialog_row');
        return OV.AddCheckbox (line, id, name, isChecked);
    }

    AddSelect (parametersDiv, name, values, defaultIndex)
    {
        let parameterRow = OV.AddDiv (parametersDiv, 'ov_dialog_row');
        OV.AddDiv (parameterRow, 'ov_dialog_row_name', name);
        let parameterValueDiv = OV.AddDiv (parameterRow, 'ov_dialog_row_value');
        return OV.AddSelect (parameterValueDiv, values, defaultIndex);
    }
};

OV.ModelExporterUI = class extends OV.ExporterUI
{
    constructor (name, format, extension)
    {
        super (name);
        this.format = format;
        this.extension = extension;
        this.visibleOnlySelect = null;
        this.rotationSelect = null;
    }

    GetType ()
    {
        return OV.ExportType.Model;
    }

    GenerateParametersUI (parametersDiv)
    {
        this.visibleOnlySelect = this.AddSelect (parametersDiv, 'Scope', ['Entire Model', 'Visible Only'], 1);
        this.rotationSelect = this.AddSelect (parametersDiv, 'Rotation', ['No Rotation', '-90 Degrees', '90 Degrees'], 0);
    }

    ExportModel (model, callbacks)
    {
        let settings = new OV.ExporterSettings ();
        if (this.visibleOnlySelect.selectedIndex === 1) {
            settings.isMeshVisible = (meshInstanceId) => {
                return callbacks.isMeshVisible (meshInstanceId);
            };
        }

        if (this.rotationSelect.selectedIndex === 1) {
            let matrix = new OV.Matrix ().CreateRotationAxisAngle (new OV.Coord3D (1.0, 0.0, 0.0), -Math.PI / 2.0);
            settings.transformation.SetMatrix (matrix);
        } else if (this.rotationSelect.selectedIndex === 2) {
            let matrix = new OV.Matrix ().CreateRotationAxisAngle (new OV.Coord3D (1.0, 0.0, 0.0), Math.PI / 2.0);
            settings.transformation.SetMatrix (matrix);
        }

        let exporterModel = new OV.ExporterModel (model, settings);
        if (exporterModel.MeshInstanceCount () === 0) {
            let errorDialog = OV.ShowMessageDialog (
                'Export Failed',
                'The model doesn\'t contain any meshes.',
                null
            );
            callbacks.onDialog (errorDialog);
            return;
        }

        let progressDialog = new OV.ProgressDialog ();
        progressDialog.Init ('Exporting Model');
        progressDialog.Show ();

        OV.RunTaskAsync (() => {
            let exporter = new OV.Exporter ();
            exporter.Export (model, settings, this.format, this.extension, {
                onError : () => {
                    progressDialog.Hide ();
                },
                onSuccess : (files) => {
                    if (files.length === 0) {
                        progressDialog.Hide ();
                    } else if (files.length === 1) {
                        progressDialog.Hide ();
                        let file = files[0];
                        OV.DownloadArrayBufferAsFile (file.GetBufferContent (), file.GetName ());
                    } else if (files.length > 1) {
                        OV.LoadExternalLibrary ('loaders/fflate.min.js').then (() => {
                            let filesInZip = {};
                            for (let file of files) {
                                filesInZip[file.name] = new Uint8Array (file.content);
                            }
                            let zippedContent = fflate.zipSync (filesInZip);
                            let zippedBuffer = zippedContent.buffer;
                            progressDialog.Hide ();
                            OV.DownloadArrayBufferAsFile (zippedBuffer, 'model.zip');
                        }).catch (() => {
                            progressDialog.Hide ();
                        });
                    }
                }
            });
        });
    }
};

OV.ImageExporterUI = class extends OV.ExporterUI
{
    constructor (name, extension)
    {
        super (name);
        this.extension = extension;
        this.sizeSelect = null;
        this.sizes = [
            { name : 'Current size', value : null },
            { name : '1280 x 720', value : [1280, 720] },
            { name : '1920 x 1080', value : [1920, 1080] }
        ];
    }

    GetType ()
    {
        return OV.ExportType.Image;
    }

    GenerateParametersUI (parametersDiv)
    {
        let sizeNames = this.sizes.map (size => size.name);
        this.sizeSelect = this.AddSelect (parametersDiv, 'Image size', sizeNames, 1);
    }

    ExportImage (viewer)
    {
        let selectedSize = this.sizes[this.sizeSelect.selectedIndex];
        let url = null;
        if (selectedSize.value === null) {
            let size = viewer.GetImageSize ();
            url = viewer.GetImageAsDataUrl (size.width, size.height);
        } else {
            url = viewer.GetImageAsDataUrl (selectedSize.value[0], selectedSize.value[1]);
        }
        OV.DownloadUrlAsFile (url, 'model.' + this.extension);
    }
};

OV.ExportDialog = class
{
    constructor (callbacks)
    {
        this.callbacks = callbacks;
        this.selectedExporter = null;
        this.parametersDiv = null;

        this.exporters = [
            new OV.ModelExporterUI ('Wavefront (.obj)', OV.FileFormat.Text, 'obj'),
            new OV.ModelExporterUI ('Stereolithography Text (.stl)', OV.FileFormat.Text, 'stl'),
            new OV.ModelExporterUI ('Stereolithography Binary (.stl)', OV.FileFormat.Binary, 'stl'),
            new OV.ModelExporterUI ('Polygon File Format Text (.ply)', OV.FileFormat.Text, 'ply'),
            new OV.ModelExporterUI ('Polygon File Format Binary (.ply)', OV.FileFormat.Binary, 'ply'),
            new OV.ModelExporterUI ('glTF Text (.gltf)', OV.FileFormat.Text, 'gltf'),
            new OV.ModelExporterUI ('glTF Binary (.glb)', OV.FileFormat.Binary, 'glb'),
            new OV.ModelExporterUI ('Object File Format Text (.off)', OV.FileFormat.Text, 'off'),
            new OV.ModelExporterUI ('Rhinoceros 3D (.3dm)', OV.FileFormat.Binary, '3dm'),
            new OV.ImageExporterUI ('PNG Image (.png)', 'png')
        ];
    }

    Show (model, viewer)
    {
        let mainDialog = new OV.ButtonDialog ();
        let contentDiv = mainDialog.Init ('Export', [
            {
                name : 'Close',
                subClass : 'outline',
                onClick () {
                    mainDialog.Hide ();
                }
            },
            {
                name : 'Export',
                onClick : () => {
                    mainDialog.Hide ();
                    this.ExportFormat (model, viewer);
                }
            }
        ]);

        let text = 'Select the format from the list below, and adjust the settings of the selected format.';
        OV.AddDiv (contentDiv, 'ov_dialog_section', text);

        let formatRow = OV.AddDiv (contentDiv, 'ov_dialog_row');
        this.parametersDiv = OV.AddDiv (contentDiv);
        let formatNames = this.exporters.map (exporter => exporter.GetName ());
        let defaultFormatIndex = 6;
        OV.AddSelect (formatRow, formatNames, defaultFormatIndex, (selectedIndex) => {
            this.OnFormatSelected (selectedIndex);
        });
        this.OnFormatSelected (defaultFormatIndex);

        mainDialog.Show ();
        this.callbacks.onDialog (mainDialog);
    }

    OnFormatSelected (selectedIndex)
    {
        OV.ClearDomElement (this.parametersDiv);
        this.selectedExporter = this.exporters[selectedIndex];
        this.selectedExporter.GenerateParametersUI (this.parametersDiv);
    }

    ExportFormat (model, viewer)
    {
        if (this.selectedExporter.GetType () === OV.ExportType.Model) {
            this.selectedExporter.ExportModel (model, {
                isMeshVisible : (meshInstanceId) => {
                    return this.callbacks.isMeshVisible (meshInstanceId);
                },
                onDialog : (filesDialog) => {
                    this.callbacks.onDialog (filesDialog);
                }
            });
        } else if (this.selectedExporter.GetType () === OV.ExportType.Image) {
            this.selectedExporter.ExportImage (viewer);
        }
    }
};
