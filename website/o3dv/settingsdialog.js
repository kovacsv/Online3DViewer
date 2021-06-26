OV.ShowSettingsDialog = function (viewerSettings, importSettings, onOk)
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
        backgroundColor: viewerSettings.backgroundColor,
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
    
    let backgroundColorInput = AddColorRow (contentDiv, dialogSettings.backgroundColor, 'Background Color', '(Visualization only)');
    backgroundColorInput.change (function () {
        let colorStr = backgroundColorInput.val ().substr (1);
        dialogSettings.backgroundColor = OV.HexStringToColor (colorStr);
    });

    let colorInput = AddColorRow (contentDiv, dialogSettings.defaultColor, 'Default Color', '(When no material defined)');
    colorInput.change (function () {
        let colorStr = colorInput.val ().substr (1);
        dialogSettings.defaultColor = OV.HexStringToColor (colorStr);
    });

    dialog.Show ();
    return dialog;
};
