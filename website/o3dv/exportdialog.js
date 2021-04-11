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
                    { name : 'text', format : OV.FileFormat.Text, extension : 'obj' }
                ]
            },
            {
                name : 'stl',
                formats : [
                    { name : 'text', format : OV.FileFormat.Text, extension : 'stl' },
                    { name : 'binary', format : OV.FileFormat.Binary, extension : 'stl' }
                ]
            },
            {
                name : 'ply',
                formats : [
                    { name : 'text', format : OV.FileFormat.Text, extension : 'ply' },
                    { name : 'binary', format : OV.FileFormat.Binary, extension : 'ply' }
                ]
            },
            {
                name : 'gltf',
                formats : [
                    { name : 'text', format : OV.FileFormat.Text, extension : 'gltf' },
                    { name : 'binary', format : OV.FileFormat.Binary, extension : 'glb' }
                ]
            },
            {
                name : 'off',
                formats : [
                    { name : 'text', format : OV.FileFormat.Text, extension : 'off' }
                ]
            }
        ];
        this.formatParameters = {
            exportFormatButtonDivs : [],
            formatSettingsDiv : null,
            selectedFormat : null
        };        
    }

    Show (model)
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

        let obj = this;
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
                onClick () {
                    let selectedFormat = obj.formatParameters.selectedFormat;
                    if (selectedFormat === null) {
                        return;
                    }
                    mainDialog.Hide ();
                    obj.ExportFormat (model);
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
            let exportFormatButton = $('<div>').addClass ('ov_dialog_select_option').html (exportFormat.name).width (buttonWidth).appendTo (exportFormatSelect);
            this.formatParameters.exportFormatButtonDivs.push (exportFormatButton);
            exportFormatButton.click (function () {
                obj.OnExportFormatSelect (i);
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
                exportFormatButtonDiv.addClass ('selected');
            } else {
                exportFormatButtonDiv.removeClass ('selected');
            }
        }

        let obj = this;
        let exportFormat = this.exportFormats[exportFormatIndex];
        for (let i = 0; i < exportFormat.formats.length; i++) {
            let format = exportFormat.formats[i];
            let formatDiv = $('<div>').addClass ('ov_dialog_table_row').appendTo (this.formatParameters.formatSettingsDiv);
            let formatInput = $('<input>').addClass ('ov_dialog_table_radio').attr ('type', 'radio').attr ('id', format.name).attr ('name', 'format').appendTo (formatDiv);
            $('<label>').attr ('for', format.name).html (format.name).appendTo (formatDiv);
            if (i === 0) {
                formatInput.prop ('checked', true);
                this.formatParameters.selectedFormat = format;
            }
            formatInput.change (function () {
                obj.formatParameters.selectedFormat = format;
            });
        }        
    }

    ExportFormat (model)
    {
        let format = this.formatParameters.selectedFormat;
        if (format === null) {
            return;
        }

        let obj = this;
        let progressDialog = new OV.ProgressDialog ();
        progressDialog.Show ('Exporting Model');
        OV.RunTaskAsync (function () {
            let exporter = new OV.Exporter ();
            let files = exporter.Export (model, format.format, format.extension);
            if (files.length === 0) {
                progressDialog.Hide ();
            } else if (files.length === 1) {
                progressDialog.Hide ();
                let file = files[0];
                OV.DownloadArrayBufferAsFile (file.GetContent (), file.GetName ());
            } else if (files.length > 1) {
                progressDialog.Hide ();
                obj.ShowExportedFiles (files);
            }
        });
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
            $('<img>').addClass ('ov_dialog_file_link_icon').attr ('src', 'assets/images/dialog/file_download.svg').appendTo (fileLink);
            $('<div>').addClass ('ov_dialog_file_link_text').html (file.GetName ()).appendTo (fileLink);
        }

        dialog.Show ();
        this.callbacks.onDialog (dialog);
    }    
};
