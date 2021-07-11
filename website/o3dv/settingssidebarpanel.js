OV.SettingsSidebarPanel = class extends OV.SidebarPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetTitle ()
    {
        return 'Settings';
    }

    InitSettings (settings)
    {
        let table = $('<div>').addClass ('ov_property_table').appendTo (this.contentDiv);

        let backgroundColorParams = settings.backgroundColor;
        this.AddColorInput (table, backgroundColorParams, function (newVal) {
            backgroundColorParams.onChange (newVal);
        });
     
    }

    AddColorInput (table, params, onChange)
    {
        let row = $('<div>').addClass ('ov_property_table_row').appendTo (table);
        let nameColum = $('<div>').addClass ('ov_property_table_cell ov_property_table_name').appendTo (row);
        let valueColumn = $('<div>').addClass ('ov_property_table_cell ov_property_table_value').appendTo (row);
        nameColum.html (params.name + ':').attr ('title', params.name);

        let colorInput = $('<input>').attr ('type', 'color').addClass ('ov_sidebar_color').appendTo (valueColumn);
        colorInput.val ('#' + OV.ColorToHexString (params.defaultValue));

        colorInput.change (function () {
            let colorStr = colorInput.val ().substr (1);
            onChange (OV.HexStringToColor (colorStr));
        });   
    }
};
