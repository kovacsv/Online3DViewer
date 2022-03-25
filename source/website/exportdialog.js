import { RunTaskAsync } from '../engine/core/taskrunner.js';
import { Coord3D } from '../engine/geometry/coord3d.js';
import { Matrix } from '../engine/geometry/matrix.js';
import { FileFormat } from '../engine/io/fileutils.js';
import { LoadExternalLibrary } from '../engine/io/externallibs.js';
import { Exporter } from '../engine/export/exporter.js';
import { ExporterModel, ExporterSettings } from '../engine/export/exportermodel.js';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { AddSelect } from '../website/utils.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { ShowMessageDialog } from './dialogs.js';
import { DownloadArrayBufferAsFile } from './utils.js';
import { CookieGetStringVal, CookieSetStringVal } from './cookiehandler.js';
import { HandleEvent } from './eventhandler.js';

class ModelExporterUI
{
    constructor (name, format, extension)
    {
        this.name = name;
        this.format = format;
        this.extension = extension;
        this.visibleOnlySelect = null;
        this.rotationSelect = null;
    }

    GetName ()
    {
        return this.name;
    }

    GenerateParametersUI (parametersDiv)
    {
        function AddSelectItem (parametersDiv, name, values, defaultIndex)
        {
            let parameterRow = AddDiv (parametersDiv, 'ov_dialog_row');
            AddDiv (parameterRow, 'ov_dialog_row_name', name);
            let parameterValueDiv = AddDiv (parameterRow, 'ov_dialog_row_value');
            return AddSelect (parameterValueDiv, values, defaultIndex);
        }

        this.visibleOnlySelect = AddSelectItem (parametersDiv, 'Scope', ['Entire Model', 'Visible Only'], 1);
        this.rotationSelect = AddSelectItem (parametersDiv, 'Rotation', ['No Rotation', '-90 Degrees', '90 Degrees'], 0);
    }

    ExportModel (model, callbacks)
    {
        let settings = new ExporterSettings ();
        if (this.visibleOnlySelect.selectedIndex === 1) {
            settings.isMeshVisible = (meshInstanceId) => {
                return callbacks.isMeshVisible (meshInstanceId);
            };
        }

        if (this.rotationSelect.selectedIndex === 1) {
            let matrix = new Matrix ().CreateRotationAxisAngle (new Coord3D (1.0, 0.0, 0.0), -Math.PI / 2.0);
            settings.transformation.SetMatrix (matrix);
        } else if (this.rotationSelect.selectedIndex === 2) {
            let matrix = new Matrix ().CreateRotationAxisAngle (new Coord3D (1.0, 0.0, 0.0), Math.PI / 2.0);
            settings.transformation.SetMatrix (matrix);
        }

        let exporterModel = new ExporterModel (model, settings);
        if (exporterModel.MeshInstanceCount () === 0) {
            ShowMessageDialog (
                'Export Failed',
                'The model doesn\'t contain any meshes.',
                null
            );
            return;
        }

        let progressDialog = new ProgressDialog ();
        progressDialog.Init ('Exporting Model');
        progressDialog.Open ();

        RunTaskAsync (() => {
            let exporter = new Exporter ();
            exporter.Export (model, settings, this.format, this.extension, {
                onError : () => {
                    progressDialog.Close ();
                },
                onSuccess : (files) => {
                    if (files.length === 0) {
                        progressDialog.Close ();
                    } else if (files.length === 1) {
                        progressDialog.Close ();
                        let file = files[0];
                        DownloadArrayBufferAsFile (file.GetBufferContent (), file.GetName ());
                    } else if (files.length > 1) {
                        LoadExternalLibrary ('loaders/fflate.min.js').then (() => {
                            let filesInZip = {};
                            for (let file of files) {
                                filesInZip[file.name] = new Uint8Array (file.content);
                            }
                            let zippedContent = fflate.zipSync (filesInZip);
                            let zippedBuffer = zippedContent.buffer;
                            progressDialog.Close ();
                            DownloadArrayBufferAsFile (zippedBuffer, 'model.zip');
                        }).catch (() => {
                            progressDialog.Close ();
                        });
                    }
                }
            });
        });
    }
}

class ExportDialog
{
    constructor (callbacks)
    {
        this.callbacks = callbacks;
        this.selectedExporter = null;
        this.parametersDiv = null;

        this.exporters = [
            new ModelExporterUI ('Wavefront (.obj)', FileFormat.Text, 'obj'),
            new ModelExporterUI ('Stereolithography Text (.stl)', FileFormat.Text, 'stl'),
            new ModelExporterUI ('Stereolithography Binary (.stl)', FileFormat.Binary, 'stl'),
            new ModelExporterUI ('Polygon File Format Text (.ply)', FileFormat.Text, 'ply'),
            new ModelExporterUI ('Polygon File Format Binary (.ply)', FileFormat.Binary, 'ply'),
            new ModelExporterUI ('glTF Text (.gltf)', FileFormat.Text, 'gltf'),
            new ModelExporterUI ('glTF Binary (.glb)', FileFormat.Binary, 'glb'),
            new ModelExporterUI ('Object File Format Text (.off)', FileFormat.Text, 'off'),
            new ModelExporterUI ('Rhinoceros 3D (.3dm)', FileFormat.Binary, '3dm')
        ];
    }

    Open (model, viewer)
    {
        let mainDialog = new ButtonDialog ();
        let contentDiv = mainDialog.Init ('Export', [
            {
                name : 'Close',
                subClass : 'outline',
                onClick () {
                    mainDialog.Close ();
                }
            },
            {
                name : 'Export',
                onClick : () => {
                    mainDialog.Close ();
                    this.ExportFormat (model, viewer);
                }
            }
        ]);

        let text = 'Select the format from the list below, and adjust the settings of the selected format.';
        AddDiv (contentDiv, 'ov_dialog_section', text);

        let formatRow = AddDiv (contentDiv, 'ov_dialog_row');
        this.parametersDiv = AddDiv (contentDiv);
        let formatNames = this.exporters.map (exporter => exporter.GetName ());
        let defaultFormat = CookieGetStringVal ('ov_last_export_format', 'glTF Binary (.glb)');
        let defaultFormatIndex = formatNames.indexOf (defaultFormat);
        if (defaultFormatIndex === -1) {
            defaultFormatIndex = 6;
        }
        AddSelect (formatRow, formatNames, defaultFormatIndex, (selectedIndex) => {
            CookieSetStringVal ('ov_last_export_format', formatNames[selectedIndex]);
            this.OnFormatSelected (selectedIndex);
        });
        this.OnFormatSelected (defaultFormatIndex);

        mainDialog.Open ();
    }

    OnFormatSelected (selectedIndex)
    {
        ClearDomElement (this.parametersDiv);
        this.selectedExporter = this.exporters[selectedIndex];
        this.selectedExporter.GenerateParametersUI (this.parametersDiv);
    }

    ExportFormat (model, viewer)
    {
        this.selectedExporter.ExportModel (model, {
            isMeshVisible : (meshInstanceId) => {
                return this.callbacks.isMeshVisible (meshInstanceId);
            }
        });
        HandleEvent ('model_exported', this.selectedExporter.GetName ());
    }
}

export function ShowExportDialog (model, viewer, callbacks)
{
    let exportDialog = new ExportDialog (callbacks);
    exportDialog.Open (model, viewer);
}
