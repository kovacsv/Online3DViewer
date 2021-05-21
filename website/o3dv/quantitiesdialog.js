OV.ShowQuantitiesDialog = function (model)
{
    function AddTableRow (table, name, value)
    {
        let row = $('<tr>').appendTo (table);
        $('<td>').html (name).appendTo (row);
        $('<td>').addClass ('right').html (value).appendTo (row);
    }

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

        const volume = OV.CalculateVolume (model);
        const surfaceArea = OV.CalculateSurfaceArea (model);
        
        let volumeString = '';
        if (volume === null) {
            volumeString = 'Model is not closed';
        } else {
            volumeString = volume.toFixed (5);
        }
        let surfaceAreaString = surfaceArea.toFixed (5);
        let table = $('<table>').addClass ('ov_dialog_table').appendTo (contentDiv);
        AddTableRow (table, 'Volume', volumeString);
        AddTableRow (table, 'Surface Area', surfaceAreaString);

        dialog.Show ();
    
    });
    return dialog;
};
