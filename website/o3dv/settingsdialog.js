OV.ShowSettingsDialog = function (importSettings, onOk)
{
    let dialogSettings = {
        defaultColor : importSettings.defaultColor
    };
    let dialog = new OV.ButtonDialog ();
    let contentDiv = dialog.Init ('Settings', [
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Hide ();
            }
        },
        {
            name : 'OK',
            onClick () {
                dialog.Hide ();                
                onOk (dialogSettings);
            }
        }
    ]);
    
    let colorRow = $('<div>').addClass ('ov_dialog_table_row').appendTo (contentDiv);
    $('<div>').html ('Default Color').addClass ('ov_dialog_table_row_name').appendTo (colorRow);
    let valueColumn = $('<div>').addClass ('ov_dialog_table_row_value').appendTo (colorRow);
    let colorInput = $('<input>').attr ('type', 'color').addClass ('ov_dialog_color').appendTo (valueColumn);
    $('<span>').addClass ('ov_dialog_table_row_comment').html ('(For surfaces with no material)').appendTo (valueColumn);
    colorInput.val ('#' + OV.ColorToHexString (dialogSettings.defaultColor));
    colorInput.change (function () {
        let colorStr = colorInput.val ().substr (1);
        dialogSettings.defaultColor = OV.HexStringToColor (colorStr);
    });
    dialog.Show ();
    return dialog;
};
