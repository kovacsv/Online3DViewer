OV.ShowSettingsDialog = function (importSettings, onOk)
{
    function AddColorRow (contentDiv, defaultColor, paramName, paramDesc)
    {
        let colorRow = $('<div>').addClass ('ov_dialog_table_row').appendTo (contentDiv);
        $('<div>').html (paramName).addClass ('ov_dialog_table_row_name').appendTo (colorRow);
        let valueColumn = $('<div>').addClass ('ov_dialog_table_row_value').appendTo (colorRow);
        let colorInput = $('<input>').attr ('type', 'color').addClass ('ov_dialog_color').appendTo (valueColumn);
        $('<span>').addClass ('ov_dialog_table_row_comment').html (paramDesc).appendTo (valueColumn);
        colorInput.val ('#' + OV.ColorToHexString (defaultColor));
        return colorInput;
    }

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
    
    let colorInput = AddColorRow (contentDiv, dialogSettings.defaultColor, 'Default Color', '(For surfaces with no material)');
    colorInput.change (function () {
        let colorStr = colorInput.val ().substr (1);
        dialogSettings.defaultColor = OV.HexStringToColor (colorStr);
    });
    dialog.Show ();
    return dialog;
};
