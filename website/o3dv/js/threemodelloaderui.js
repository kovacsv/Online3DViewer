OV.ThreeModelLoaderUI = class
{
    constructor ()
    {
        this.modelLoader = new OV.ThreeModelLoader ();
        this.modalDialog = null;
    }

    LoadModel (files, fileSource, settings, callbacks)
    {
        if (this.modelLoader.InProgress ()) {
            return;
        }

        let progressDialog = null;
        this.modelLoader.LoadModel (files, fileSource, settings, {
            onLoadStart : () => {
                this.CloseDialogIfOpen ();
                callbacks.onStart ();
                progressDialog = new OV.ProgressDialog ();
                progressDialog.Init ('Loading Model');
                progressDialog.Show ();
            },
            onSelectMainFile : (fileNames, selectFile) => {
                progressDialog.Hide ();
                this.modalDialog = this.ShowFileSelectorDialog (fileNames, (index) => {
                    progressDialog.Show ();
                    selectFile (index);
                });
            },
            onImportStart : () => {
                progressDialog.SetText ('Importing Model');
            },
            onVisualizationStart : () => {
                progressDialog.SetText ('Visualizing Model');
            },
            onModelFinished : (importResult, threeObject) => {
                progressDialog.Hide ();
                callbacks.onFinish (importResult, threeObject);
            },
            onTextureLoaded : () => {
                callbacks.onRender ();
            },
            onLoadError : (importError) => {
                progressDialog.Hide ();
                callbacks.onError (importError);
                this.modalDialog = this.ShowErrorDialog (importError);
            },
        });
    }

    GetModelLoader ()
    {
        return this.modelLoader;
    }

    GetImporter ()
    {
        return this.modelLoader.GetImporter ();
    }

    ShowErrorDialog (importError)
    {
        if (importError.code === OV.ImportErrorCode.NoImportableFile) {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'No importable file found.',
                importError.message
            );
        } else if (importError.code === OV.ImportErrorCode.FailedToLoadFile) {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'Failed load file for import.',
                importError.message
            );
        } else if (importError.code === OV.ImportErrorCode.ImportFailed) {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'Failed to import model.',
                importError.message
            );
        } else {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'Unknown error.',
                importError.message
            );
        }
    }

    ShowFileSelectorDialog (fileNames, onSelect)
    {
        let dialog = new OV.ButtonDialog ();
        let contentDiv = dialog.Init ('Select Model', [
            {
                name : 'Cancel',
                subClass : 'outline',
                onClick () {
                    dialog.Hide ();
                }
            }
        ]);
        dialog.SetCloseHandler (() => {
            onSelect (null);
        });

        let text = 'Multiple importable models found. Select the model you would like to import from the list below.';
        OV.AddDiv (contentDiv, 'ov_dialog_message', text);

        let fileListSection = OV.AddDiv (contentDiv, 'ov_dialog_section');
        let fileList = OV.AddDiv (fileListSection, 'ov_dialog_import_file_list ov_thin_scrollbar');

        for (let i = 0; i < fileNames.length; i++) {
            let fileName = fileNames[i];
            let fileLink = OV.AddDiv (fileList, 'ov_dialog_file_link');
            OV.AddSvgIconElement (fileLink, 'meshes', 'ov_file_link_img');
            OV.AddDiv (fileLink, 'ov_dialog_file_link_text', fileName);
            fileLink.addEventListener ('click', () => {
                dialog.SetCloseHandler (null);
                dialog.Hide ();
                onSelect (i);
            });
        }

        dialog.Show ();
        return dialog;
    }

    CloseDialogIfOpen ()
    {
        if (this.modalDialog !== null) {
            this.modalDialog.Hide ();
            this.modalDialog = null;
        }
    }
};
