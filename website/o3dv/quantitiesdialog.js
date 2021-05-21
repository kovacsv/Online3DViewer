OV.ShowQuantitiesPopup = function (parentItem, element)
{
    let popup = new OV.PopupDialog ();
    let contentDiv = popup.Init (parentItem);
    
    $('<div>').addClass ('ov_popup_title').html ('Volume').appendTo (contentDiv);
    let volumeDiv = $('<div>').addClass ('ov_popup_text').html ('Calculating...').appendTo (contentDiv);
    $('<div>').addClass ('ov_popup_title').html ('Surface Area').appendTo (contentDiv);
    let surfaceAreaDiv = $('<div>').addClass ('ov_popup_text').html ('Calculating...').appendTo (contentDiv);

    OV.RunTaskAsync (function () {
        const volume = OV.CalculateVolume (element);
        const surfaceArea = OV.CalculateSurfaceArea (element);
        
        let volumeString = '';
        if (volume === null) {
            volumeString = 'The model is not closed.';
        } else {
            volumeString = volume.toFixed (5);
        }
        let surfaceAreaString = surfaceArea.toFixed (5);
        
        volumeDiv.html (volumeString);
        surfaceAreaDiv.html (surfaceAreaString);
    });

    popup.Show ();
    return popup;
};
