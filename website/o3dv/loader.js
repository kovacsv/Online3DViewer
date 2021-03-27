OV.InitModelLoader = function (modelLoader, callbacks)
{
    function OpenErrorDialog (importerError)
    {
        if (importerError.code === OV.ImporterErrorCode.NoImportableFile) {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'No importable file found. You can open obj, 3ds, stl, ply, gltf, glb and off files.',
                importerError.message
            );
        } else if (importerError.code === OV.ImporterErrorCode.ImportFailed) {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'Failed to import model.',
                importerError.message
            );
        } else {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'Unknown error.',
                importerError.message
            );
        }
    }

    function CloseDialogIfOpen (dialog)
    {
        if (dialog !== null) {
            dialog.Hide ();
            dialog = null;
        }
    }

    let errorDialog = null;
    let progressDialog = null;
    modelLoader.Init ({
        onLoadStart : function () {
            CloseDialogIfOpen (errorDialog);
            callbacks.onStart ();
            progressDialog = new OV.ProgressDialog ();
            progressDialog.Show ('Loading Model');
        },
        onFilesLoaded : function () {
            progressDialog.SetText ('Importing Model');
        },
        onModelImported : function () {
            progressDialog.SetText ('Visualizing Model');
        },
        onModelFinished : function (importResult, threeMeshes) {
            progressDialog.Hide ();
            callbacks.onFinish (importResult, threeMeshes);
        },
        onTextureLoaded : function () {
            callbacks.onRender ();
        },
        onLoadError : function (importerError) {
            progressDialog.Hide ();
            errorDialog = OpenErrorDialog (importerError);
        },
    });
};
