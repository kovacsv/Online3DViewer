OV.ExportType = 
{
    Model : 1,
    Image : 2
};

OV.ExportDialog = class
{
    constructor (callbacks)
    {
        this.callbacks = callbacks;
        this.model = null;
        this.exportFormats = [
            {
                name : 'obj',
                formats : [
                    { name : 'text', type: OV.ExportType.Model, format : OV.FileFormat.Text, extension : 'obj' }
                ]
            },
            {
                name : 'stl',
                formats : [
                    { name : 'text', type: OV.ExportType.Model, format : OV.FileFormat.Text, extension : 'stl' },
                    { name : 'binary', type: OV.ExportType.Model, format : OV.FileFormat.Binary, extension : 'stl' }
                ]
            },
            {
                name : 'ply',
                formats : [
                    { name : 'text', type: OV.ExportType.Model, format : OV.FileFormat.Text, extension : 'ply' },
                    { name : 'binary', type: OV.ExportType.Model, format : OV.FileFormat.Binary, extension : 'ply' }
                ]
            },
            {
                name : 'gltf',
                formats : [
                    { name : 'text', type: OV.ExportType.Model, format : OV.FileFormat.Text, extension : 'gltf' },
                    { name : 'binary', type: OV.ExportType.Model, format : OV.FileFormat.Binary, extension : 'glb' }
                ]
            },
            {
                name : 'off',
                formats : [
                    { name : 'text', type: OV.ExportType.Model, format : OV.FileFormat.Text, extension : 'off' }
                ]
            },
            {
                name : '3dm',
                formats : [
                    { name : 'binary', type: OV.ExportType.Model, format : OV.FileFormat.Binary, extension : '3dm' }
                ]
            },
            {
                name : 'png',
                formats : [
                    { name : 'current size', type: OV.ExportType.Image, width : null, height : null, extension : 'png' },
                    { name : 'fixed size (1920x1080)', type: OV.ExportType.Image, width : 1920, height : 1080, extension : 'png' }
                ]
            }
        ];
        this.formatParameters = {
            exportFormatButtonDivs : [],
            formatSettingsDiv : null,
            selectedFormat : null
        };        
    }

    Show (model, viewer)
    {
        if (model === null) {
            let messageDialog = OV.ShowMessageDialog (
                'Export Failed',
                'Please load a model before exporting.',
                null
            );            
            this.callbacks.onDialog (messageDialog);
            return;
        }

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
                    let selectedFormat = this.formatParameters.selectedFormat;
                    if (selectedFormat === null) {
                        return;
                    }
                    mainDialog.Hide ();
                    this.ExportFormat (model, viewer);
                }
            }
        ]);
        
        let text = 'Select a format from the below list to export your model. Please note that the export can take several second.';
        $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
 
        let buttonWidth = 40;
        let optionsHeight = 50;
        let exportFormatSelect = $('<div>').addClass ('ov_dialog_select').appendTo (contentDiv);
        this.formatParameters.formatSettingsDiv = $('<div>').addClass ('ov_dialog_section').height (optionsHeight).appendTo (contentDiv);
        for (let i = 0; i < this.exportFormats.length; i++) {
            let exportFormat = this.exportFormats[i];
            let exportFormatButton = $('<div>').addClass ('ov_button').addClass ('outline').addClass ('ov_dialog_select_option').html (exportFormat.name).width (buttonWidth).appendTo (exportFormatSelect);
            this.formatParameters.exportFormatButtonDivs.push (exportFormatButton);
            exportFormatButton.click (() => {
                this.OnExportFormatSelect (i);
            });
        }
        this.OnExportFormatSelect (0);
     
        mainDialog.Show ();
        this.callbacks.onDialog (mainDialog);
    }

    OnExportFormatSelect (exportFormatIndex)
    {
        this.formatParameters.formatSettingsDiv.empty ();
        for (let i = 0; i < this.formatParameters.exportFormatButtonDivs.length; i++) {
            let exportFormatButtonDiv = this.formatParameters.exportFormatButtonDivs[i];
            if (i === exportFormatIndex) {
                exportFormatButtonDiv.removeClass ('outline');
            } else {
                exportFormatButtonDiv.addClass ('outline');
            }
        }

        let exportFormat = this.exportFormats[exportFormatIndex];
        for (let i = 0; i < exportFormat.formats.length; i++) {
            let format = exportFormat.formats[i];
            let formatDiv = $('<div>').addClass ('ov_dialog_row').appendTo (this.formatParameters.formatSettingsDiv);
            let formatInput = $('<input>').addClass ('ov_dialog_checkradio').attr ('type', 'radio').attr ('id', format.name).attr ('name', 'format').appendTo (formatDiv);
            $('<label>').attr ('for', format.name).html (format.name).appendTo (formatDiv);
            if (i === 0) {
                formatInput.prop ('checked', true);
                this.formatParameters.selectedFormat = format;
            }
            formatInput.change (() => {
                this.formatParameters.selectedFormat = format;
            });
        }        
    }

    ExportFormat (model, viewer)
    {
        let selectedFormat = this.formatParameters.selectedFormat;
        if (selectedFormat === null) {
            return;
        }

        if (selectedFormat.type === OV.ExportType.Model) {
            let progressDialog = new OV.ProgressDialog ();
            progressDialog.Init ('Exporting Model');
            progressDialog.Show ();
            OV.RunTaskAsync (() => {
                let exporter = new OV.Exporter ();
                exporter.Export (model, selectedFormat.format, selectedFormat.extension, {
                    onError : () => {
                        progressDialog.Hide ();
                    },
                    onSuccess : (files) => {
                        if (files.length === 0) {
                            progressDialog.Hide ();
                        } else if (files.length === 1) {
                            progressDialog.Hide ();
                            let file = files[0];
                            OV.DownloadArrayBufferAsFile (file.GetContent (), file.GetName ());
                        } else if (files.length > 1) {
                            progressDialog.Hide ();
                            this.ShowExportedFiles (files);
                        }
                    }
                });
            });
        } else if (selectedFormat.type === OV.ExportType.Image) {
            let url = null;
            if (selectedFormat.width === null || selectedFormat.height === null) {
                let size = viewer.GetImageSize ();
                url = viewer.GetImageAsDataUrl (size.width, size.height);
            } else {
                url = viewer.GetImageAsDataUrl (selectedFormat.width, selectedFormat.height);
            }
            OV.DownloadUrlAsFile (url, 'model.' + selectedFormat.extension);
        }
    }

    ShowExportedFiles (files)
    {
        let dialog = new OV.ButtonDialog ();
        let contentDiv = dialog.Init ('Exported Files', [
            {
                name : 'Close',
                onClick () {
                    dialog.Hide ();
                }
            }
        ]);

        let text = 'You can download your exported files here.';
        $('<div>').html (text).addClass ('ov_dialog_section').appendTo (contentDiv);
        
        let fileListSection = $('<div>').addClass ('ov_dialog_section').appendTo (contentDiv);
        let fileList = $('<div>').addClass ('ov_dialog_file_list').addClass ('ov_thin_scrollbar').appendTo (fileListSection);        
        
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let url = OV.CreateObjectUrl (file.GetContent ());
            let fileLink = $('<a>').addClass ('ov_dialog_file_link').appendTo (fileList);
            fileLink.attr ('href', url);
            fileLink.attr ('download', file.GetName ());
            OV.CreateSvgIcon (fileLink, 'file_download', 'ov_file_link_img');
            $('<div>').addClass ('ov_dialog_file_link_text').html (file.GetName ()).appendTo (fileLink);
        }

        dialog.Show ();
        this.callbacks.onDialog (dialog);
    }    
};
