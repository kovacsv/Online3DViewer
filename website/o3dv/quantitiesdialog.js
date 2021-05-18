OV.ShowQuantitiesDialog = function (model)
{
    if (model === null) {
        return OV.ShowMessageDialog (
            'Quantity Calculation Failed',
            'Please load a model before calculating quantities.',
            null
        );
    }

    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Quantities', [
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();
            }
        }
    ]);

    let progressDialog = new OV.ProgressDialog ();
    progressDialog.Show ('Calculating Quantities');
    OV.RunTaskAsync (function () {
        progressDialog.Hide ();

        const volume = OV.CalculateModelVolume (model);
        const surfaceArea = OV.CalculateModelSurfaceArea (model);
        
        let volumeString = '';
        if (volume === null) {
            volumeString = 'Model is not closed';
        } else {
            volumeString = volume.toFixed (5);
        }
        const surfaceAreaString = surfaceArea.toFixed (5);
        $('<div>').html ('Volume: ' + volumeString).appendTo (contentDiv);
        $('<div>').html ('Surface Area: ' + surfaceAreaString).appendTo (contentDiv);

        dialog.Show ();
    
    });
    return dialog;
};
