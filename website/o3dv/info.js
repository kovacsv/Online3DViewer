OV.InfoPanel = class
{
    constructor (parentDiv)
    {
        this.mainDiv = $('<div>').addClass ('ov_info_panel_main').appendTo (parentDiv);
        this.treeView = new OV.TreeView (this.mainDiv);
        this.detailsItem = new OV.TreeViewGroupItem ('Details', 'assets/images/tree/details.svg');
        this.detailsItem.ShowChildren (!OV.IsSmallHeight (), null);
        this.treeView.AddItem (this.detailsItem);
        let childrenDiv = this.detailsItem.CreateChildrenDiv ();
        childrenDiv.addClass ('ov_info_panel_content');
        this.popup = null;
    }

    SetOpenCloseHandler (openCloseHandler)
    {
        this.detailsItem.SetAnimated (false);
        this.detailsItem.SetOpenCloseHandler (openCloseHandler);
    }

    FillWithMaterialInfo (info, callbacks)
    {
        function AddRow (container, name, fillValue)
        {
            let row = $('<div>').addClass ('ov_info_box_row').appendTo (container);
            $('<div>').addClass ('ov_info_box_row_name').html (name).appendTo (row);
            let value = $('<div>').addClass ('ov_info_box_row_value').appendTo (row);
            fillValue (value);
        }

        function AddTextRow (container, name, value)
        {
            AddRow (container, name, function (valueDiv) {
                valueDiv.html (value).attr ('title', value);
            });
        }

        function AddTextureRow (container, textureName)
        {
            AddRow (container, textureName.type, function (valueDiv) {
                valueDiv.html (textureName.name).attr ('title', textureName.path);
            });
        }

        this.Clear ();
        if (info === null) {
            return;
        }

        let contentDiv = this.detailsItem.GetChildrenDiv ();

        let infoContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
        AddRow (infoContainer, 'Color', function (valueDiv) {
            let colorString = '#' + OV.ColorToHexString (info.diffuse);
            $('<div>').addClass ('ov_info_box_rgbbox').css ('background', colorString).attr ('title', colorString).appendTo (valueDiv);
            $('<div>').addClass ('ov_info_box_rgbtext').html (colorString).attr ('title', colorString).appendTo (valueDiv);
        });
        let opacityString = parseInt (Math.round (info.opacity * 100.0), 10) + '%';
        AddTextRow (infoContainer, 'Opacity', opacityString);
        
        if (info.textureNames.length > 0) {
            let texturesContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
            $('<div>').addClass ('ov_info_box_title').html ('Textures').appendTo (texturesContainer);
            let texturesContent = $('<div>').addClass ('ov_info_box_details').appendTo (texturesContainer);
            for (let i = 0; i < info.textureNames.length; i++) {
                let textureName = info.textureNames[i];
                AddTextureRow (texturesContent, textureName);
            }
        }

        let meshItems = [];
        for (let i = 0; i < info.usedByMeshes.length; i++) {
            let meshInfo = info.usedByMeshes[i];
            meshItems.push ({
                name : OV.GetMeshName (meshInfo.name)
            });
        }

        let obj = this;
        let meshesText = 'Meshes (' + meshItems.length + ')';
        this.CreateButton (contentDiv, meshesText, function (button) {
            if (meshItems.length === 0) {
                return;
            }
            obj.popup = OV.ShowListPopup (button, meshItems, {
                onHoverStart : function (index) {
                    const meshItem = info.usedByMeshes[index];
                    callbacks.onMeshHover (meshItem.index);
                },
                onHoverStop : function (index) {
                    callbacks.onMeshHover (null);
                },
                onClick : function (index) {
                    const meshItem = info.usedByMeshes[index];
                    callbacks.onMeshSelect (meshItem.index);
                }
            });
        });
    }

    FillWithModelInfo (info, callbacks)
    {
        function AddCounter (parent, name, value)
        {
            let infoBox = $('<div>').addClass ('ov_info_box_column').css ('width', '50%').appendTo (parent);
            $('<div>').addClass ('ov_info_box_title').html (name).appendTo (infoBox);
            $('<div>').addClass ('ov_info_box_content_big').html (value.toLocaleString ('en-US')).appendTo (infoBox);
        }

        this.Clear ();
        if (info === null) {
            return;
        }

        let contentDiv = this.detailsItem.GetChildrenDiv ();

        let counterContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
        AddCounter (counterContainer, 'Vertices', info.element.VertexCount ());
        AddCounter (counterContainer, 'Triangles', info.element.TriangleCount ());

        let sizeContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
        $('<div>').addClass ('ov_info_box_title').html ('Size').appendTo (sizeContainer);
        let size = OV.SubCoord3D (info.boundingBox.max, info.boundingBox.min);
        let sizeString = size.x.toFixed (1) + ' x ' + size.y.toFixed (1) + ' x ' + size.z.toFixed (1);
        $('<div>').addClass ('ov_info_box_content').html (sizeString).attr ('title', sizeString).appendTo (sizeContainer);

        let materialItems = [];
        for (let i = 0; i < info.usedMaterials.length; i++) {
            let usedMaterial = info.usedMaterials[i];
            materialItems.push ({
                name : OV.GetMaterialName (usedMaterial.name),
                color : OV.ColorToHexString (usedMaterial.diffuse)
            });
        }

        let obj = this;
        if (OV.FeatureSet.CalculateQuantities) {
            this.CreateButton (contentDiv, 'Calculate Quantities', function (button) {
                obj.popup = OV.ShowQuantitiesPopup (button, info.element);
            });   
        }

        let materialsText = 'Materials (' + materialItems.length + ')';
        this.CreateButton (contentDiv, materialsText, function (button) {
            obj.popup = OV.ShowListPopup (button, materialItems, {
                onClick : function (index) {
                    let usedMaterial = info.usedMaterials[index];
                    callbacks.onMaterialSelect (usedMaterial.index);
                }
            });
        });        
    }

    CreateButton (parentDiv, buttonText, onClick)
    {
        let button = $('<div>').addClass ('ov_info_box_button').appendTo (parentDiv);
        $('<div>').addClass ('ov_info_box_button_text').html (buttonText).appendTo (button);
        $('<img>').addClass ('ov_info_box_button_icon').attr ('src', 'assets/images/tree/arrow_right.svg').appendTo (button);
        button.click (function () {
            onClick (button);
        });
    }

    Clear ()
    {
        if (this.popup !== null) {
            this.popup.Hide ();
            this.popup = null;
        }        
        let contentDiv = this.detailsItem.GetChildrenDiv ();
        contentDiv.empty ();
    }
};
