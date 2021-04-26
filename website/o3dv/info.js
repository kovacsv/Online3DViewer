OV.InfoPanel = class
{
    constructor (parentDiv)
    {
        this.mainDiv = $('<div>').addClass ('ov_info_panel_main').appendTo (parentDiv);
        this.treeView = new OV.TreeView (this.mainDiv);
        this.measureItem = new OV.TreeViewGroupItem ('Measures', 'assets/images/toolbar/measure.svg');
        this.measureItem.ShowChildren (false, null);
        this.treeView.AddItem (this.measureItem);
        let childrenDiv = this.measureItem.CreateChildrenDiv ();
        childrenDiv.addClass ('ov_info_panel_content');

        this.detailsItem = new OV.TreeViewGroupItem ('Details', 'assets/images/tree/details.svg');
        this.detailsItem.ShowChildren (!OV.IsSmallHeight (), null);
        this.treeView.AddItem (this.detailsItem);
        childrenDiv = this.detailsItem.CreateChildrenDiv ();
        childrenDiv.addClass ('ov_info_panel_content');
        this.popup = null;
    }

    SetOpenCloseHandler (openCloseHandler)
    {
        this.detailsItem.SetAnimated (false);
        this.detailsItem.SetOpenCloseHandler (openCloseHandler);        
    }

    FillWithMaterialInfo (info, getMeshInfo, callbacks)
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
            let meshInfo = getMeshInfo (info.usedByMeshes[i]);
            meshItems.push ({
                name : OV.GetMeshName (meshInfo.name)
            });
        }

        let obj = this;
        let meshesText = 'Meshes (' + meshItems.length + ')';
        let meshesButton = $('<div>').addClass ('ov_info_box_button').html (meshesText).appendTo (contentDiv);
        meshesButton.click (function () {
            if (meshItems.length === 0) {
                return;
            }
            obj.popup = OV.ShowListPopup (meshesButton, meshItems, {
                onHoverStart : function (index) {
                    callbacks.onMeshHover (info.usedByMeshes[index]);
                },
                onHoverStop : function (index) {
                    callbacks.onMeshHover (null);
                },
                onClick : function (index) {
                    callbacks.onMeshSelect (info.usedByMeshes[index]);
                }
            });
        });
    }

    AddCounter (parent, name, value)
    {
        let infoBox = $('<div>').addClass ('ov_info_box_column').css ('width', '50%').appendTo (parent);
        $('<div>').addClass ('ov_info_box_title').html (name).appendTo (infoBox);
        $('<div>').addClass ('ov_info_box_content_big').html (value.toLocaleString ('en-US')).appendTo (infoBox);
    }        


    FillWithModelInfo (info, getMaterialInfo, callbacks)
    {
        this.Clear ();
        if (info === null) {
            return;
        }

        let contentDiv = this.detailsItem.GetChildrenDiv ();

        let counterContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
        this.AddCounter (counterContainer, 'Vertices', info.vertexCount);
        this.AddCounter (counterContainer, 'Triangles', info.triangleCount);

        let sizeContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
        $('<div>').addClass ('ov_info_box_title').html ('Size').appendTo (sizeContainer);
        let size = OV.SubCoord3D (info.boundingBox.max, info.boundingBox.min);
        let sizeString = size.x.toFixed (1) + ' x ' + size.y.toFixed (1) + ' x ' + size.z.toFixed (1);
        $('<div>').addClass ('ov_info_box_content').html (sizeString).attr ('title', sizeString).appendTo (sizeContainer);

        let materialItems = [];
        for (let i = 0; i < info.usedMaterials.length; i++) {
            let materialInfo = getMaterialInfo (info.usedMaterials[i]);
            materialItems.push ({
                name : OV.GetMaterialName (materialInfo.name),
                color : OV.ColorToHexString (materialInfo.diffuse)
            });
        }

        let obj = this;
        let materialsText = 'Materials (' + materialItems.length + ')';
        let materialsButton = $('<div>').addClass ('ov_info_box_button').html (materialsText).appendTo (contentDiv);
        materialsButton.click (function () {
            obj.popup = OV.ShowListPopup (materialsButton, materialItems, {
                onClick : function (index) {
                    callbacks.onMaterialSelect (info.usedMaterials[index]);
                }
            });
        });
    }

    UpdateMeasure (distance, angle) 
    {
        let contentDiv = this.measureItem.GetChildrenDiv ();
        contentDiv.empty ();

        if (distance === null || angle === null) {
            this.measureItem.ShowChildren (false, null);
            return;
        }
        this.measureItem.ShowChildren (true, null);

        let measureContainer = $('<div>').addClass ('ov_info_box').appendTo (contentDiv);
        this.AddCounter (measureContainer, 'Distance', distance.toFixed(2));
        this.AddCounter (measureContainer, 'Angle', (angle * 180 / Math.PI).toFixed(2) + '°');
    }

    Clear ()
    {
        if (this.popup !== null) {
            this.popup.Hide ();
            this.popup = null;
        }        
        this.detailsItem.GetChildrenDiv ().empty ();
        this.measureItem.GetChildrenDiv ().empty ();
    }
};
