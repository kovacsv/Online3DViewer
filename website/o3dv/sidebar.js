OV.PropertyType =
{
    Text : 1
};

OV.Sidebar = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.visible = true;
        this.titleDiv = $('<div>').addClass ('ov_sidebar_title').appendTo (parentDiv);
        this.titleDiv.html ('Details');
        this.contentDiv = $('<div>').addClass ('ov_sidebar_content').addClass ('ov_thin_scrollbar').appendTo (parentDiv);
    }

    Show (show)
    {
        this.visible = show;
        if (show) {
            this.parentDiv.show ();
        } else {
            this.parentDiv.hide ();
        }
    }

    IsVisible ()
    {
        return this.visible;
    }

    AddProperties (properties)
    {
        function AddProperty (table, name, value)
        {
            let row = $('<tr>').appendTo (table);
            let nameColum = $('<td>').addClass ('ov_property_table_name').appendTo (row);
            let valueColumn = $('<td>').addClass ('ov_property_table_value').appendTo (row);
            nameColum.html (name).attr ('title', name);
            valueColumn.html (value).attr ('title', value);
        }

        this.Clear ();
        let table = $('<table>').addClass ('ov_property_table').appendTo (this.contentDiv);
        AddProperty (table, 'Vertex Count', '1245');
        AddProperty (table, 'Triangle Count', '23466');
        AddProperty (table, 'Size', '12.0 x 14.0 x 6.0');
        AddProperty (table, 'Volume', '23423');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Emission Texture', 'Very very long property value');
        AddProperty (table, 'Very very long property name', 'Very very long property value');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        AddProperty (table, 'Surface Area', '45463');
        this.Resize ();
    }

    Resize ()
    {
        let titleHeight = this.titleDiv.outerHeight (true);
        let height = this.parentDiv.height ();
        this.contentDiv.outerHeight (height - titleHeight, true);
    }

    Clear ()
    {
        this.contentDiv.empty ();
    }
};
