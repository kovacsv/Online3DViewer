OV.InitModelLoader = function (modelLoader, callbacks)
{
    function OpenErrorDialog (importError)
    {
        if (importError.code === OV.ImportErrorCode.NoImportableFile) {
            return OV.ShowMessageDialog (
                'Something went wrong',
                'No importable file found.',
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
        onLoadStart : () => {
            CloseDialogIfOpen (errorDialog);
            callbacks.onStart ();
            progressDialog = new OV.ProgressDialog ();
            progressDialog.Init ('Loading Model');
            progressDialog.Show ();
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
            errorDialog = OpenErrorDialog (importError);
        },
    });
};
