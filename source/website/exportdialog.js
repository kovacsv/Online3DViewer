import { RunTaskAsync } from '../engine/core/taskrunner.js';
import { Coord3D } from '../engine/geometry/coord3d.js';
import { Matrix } from '../engine/geometry/matrix.js';
import { FileFormat } from '../engine/io/fileutils.js';
import { LoadExternalLibrary } from '../engine/io/externallibs.js';
import { Exporter } from '../engine/export/exporter.js';
import { ExporterModel, ExporterSettings } from '../engine/export/exportermodel.js';
import { AddDiv, AddRadioButton, AddSelect, CreateDomElement, ClearDomElement } from '../engine/viewer/domutils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { DownloadArrayBufferAsFile, DownloadUrlAsFile } from './utils.js';
import { CookieGetStringVal, CookieSetStringVal } from './cookiehandler.js';
import { HandleEvent } from './eventhandler.js';

const ExportType =
{
    Model : 0,
    Image : 1
};

class ExporterUI
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

    AddSelectItem (parametersDiv, name, values, defaultIndex)
    {
        let parameterRow = AddDiv (parametersDiv, 'ov_dialog_row');
        AddDiv (parameterRow, 'ov_dialog_row_name', name);
        let parameterValueDiv = AddDiv (parameterRow, 'ov_dialog_row_value');
        return AddSelect (parameterValueDiv, values, defaultIndex);
    }
}

class ModelExporterUI extends ExporterUI
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
        return ExportType.Model;
    }

    GenerateParametersUI (parametersDiv)
    {
        this.visibleOnlySelect = this.AddSelectItem (parametersDiv, 'Scope', ['Entire Model', 'Visible Only'], 1);
        this.rotationSelect = this.AddSelectItem (parametersDiv, 'Rotation', ['No Rotation', '-90 Degrees', '90 Degrees'], 0);
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

class ImageExporterUI extends ExporterUI
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
        return ExportType.Image;
    }

    GenerateParametersUI (parametersDiv)
    {
        let sizeNames = this.sizes.map (size => size.name);
        this.sizeSelect = this.AddSelectItem (parametersDiv, 'Image size', sizeNames, 1);
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
        DownloadUrlAsFile (url, 'model.' + this.extension);
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
            new ModelExporterUI ('Rhinoceros 3D (.3dm)', FileFormat.Binary, '3dm'),
            new ImageExporterUI ('PNG Image (.png)', 'png')
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
        if (this.selectedExporter.GetType () === ExportType.Model) {
            this.selectedExporter.ExportModel (model, {
                isMeshVisible : (meshInstanceId) => {
                    return this.callbacks.isMeshVisible (meshInstanceId);
                }
            });
            HandleEvent ('model_exported', this.selectedExporter.GetName ());
        } else if (this.selectedExporter.GetType () === ExportType.Image) {
            this.selectedExporter.ExportImage (viewer);
        }
    }
}

export function ShowExportDialog (model, viewer, callbacks)
{
    let exportDialog = new ExportDialog (callbacks);
    exportDialog.Open (model, viewer);
}

export function ShowSnapshotDialog (viewer)
{
    function AddSizeRadioButton (parentDiv, id, text, isSelected, onChange)
    {
        let line = AddDiv (parentDiv, 'ov_dialog_row');
        AddRadioButton (line, id, 'snapshot_size', text, isSelected, onChange);
    }

    function GetImageUrl (viewer, snapshotSize)
    {
        if (snapshotSize.size === null) {
            let size = viewer.GetImageSize ();
            return viewer.GetImageAsDataUrl (size.width, size.height);
        } else {
            return viewer.GetImageAsDataUrl (snapshotSize.size[0], snapshotSize.size[1]);
        }
    }

    function UpdatePreview (viewer, previewImage, snapshotSize)
    {
        let url = GetImageUrl (viewer, snapshotSize);
        previewImage.src = url;
    }

    let selectedIndex = 0;
    let sizes = [
        {
            name : 'Current size',
            size : null
        },
        {
            name : '1280 x 720',
            size : [1280, 720]
        },
        {
            name : '1920 x 1080',
            size : [1920, 1080]
        }
    ];

    let dialog = new ButtonDialog ();
    let contentDiv = dialog.Init ('Create Snapshot', [
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Close ();
            }
        },
        {
            name : 'Create',
            onClick () {
                dialog.Close ();
                let url = GetImageUrl (viewer, sizes[selectedIndex]);
                DownloadUrlAsFile (url, 'model.png');
            }
        }
    ]);

    let optionsDiv = AddDiv (contentDiv, 'ov_snapshot_dialog_left');
    let previewImage = CreateDomElement ('img', 'ov_snapshot_dialog_preview');

    let lastSnapshotSizeName = CookieGetStringVal ('ov_last_snapshot_size', sizes[0].name);
    for (let i = 0; i < sizes.length; i++) {
        if (lastSnapshotSizeName === sizes[i].name) {
            selectedIndex = i;
            break;
        }
    }

    for (let i = 0; i < sizes.length; i++) {
        let size = sizes[i];
        let selected = (i === selectedIndex);
        AddSizeRadioButton (optionsDiv, 'snapshot_' + i.toString (), size.name, selected, () => {
            selectedIndex = i;
            CookieSetStringVal ('ov_last_snapshot_size', size.name);
            UpdatePreview (viewer, previewImage, size);
        });
    }

    contentDiv.appendChild (previewImage);
    UpdatePreview (viewer, previewImage, sizes[selectedIndex]);

    dialog.Open ();
    return dialog;
}
