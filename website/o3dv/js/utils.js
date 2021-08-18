OV.GetNameOrDefault = function (originalName, defaultName)
{
    if (originalName.length > 0) {
        return originalName;
    }
    return defaultName;
};

OV.GetMeshName = function (originalName)
{
    return OV.GetNameOrDefault (originalName, 'No Name');
};

OV.GetMaterialName = function (originalName)
{
    return OV.GetNameOrDefault (originalName, 'No Name');
};

OV.IsHoverEnabled = function ()
{
    if (window.matchMedia ('(hover : hover)').matches) {
        return true;
    } else {
        return false;
    }
};

OV.IsSmallWidth = function ()
{
    if (window.matchMedia ('(max-width : 700px)').matches) {
        return true;
    } else {
        return false;
    }
};

OV.IsSmallHeight = function ()
{
    if (window.matchMedia ('(max-height : 700px)').matches) {
        return true;
    } else {
        return false;
    }
};

OV.InstallTooltip = function (item, text)
{
    function CalculateOffset (item, tooltip)
    {
        let windowObj = $(window);
        let windowWidth = windowObj.outerWidth (true);

        let itemOffset = item.offset ();
        let itemWidth = item.outerWidth (true);
        let itemHeight = item.outerHeight (true);
        let tooltipWidth = tooltip.outerWidth (true);
        
        let tooltipMargin = 10;
        let left = itemOffset.left + itemWidth / 2 - tooltipWidth / 2;
        if (left + tooltipWidth > windowWidth - tooltipMargin) {
            left = windowWidth - tooltipWidth - tooltipMargin;
        }
        if (left < tooltipMargin) {
            left = tooltipMargin;
        }
        left = Math.max (left, 0);
        return {
            left : left,
            top : itemOffset.top + itemHeight + tooltipMargin
        };
    }

    if (!OV.IsHoverEnabled ()) {
        return;
    }
    
    let bodyObj = $(document.body);
    let tooltip = null;
    item.hover (
        () => {
            tooltip = $('<div>').html (text).addClass ('ov_tooltip').appendTo (bodyObj);
            tooltip.offset (CalculateOffset (item, tooltip));
        },
        () => {
            tooltip.remove ();
        }
    );
};

OV.CopyToClipboard = function (text)
{
    let input = document.createElement ('input');
    input.style.position = 'absolute';
    input.style.left = '0';
    input.style.top = '0';
    input.setAttribute ('value', text);
    document.body.appendChild (input);
    input.select ();
    document.execCommand ('copy');
    document.body.removeChild (input);
};

OV.DownloadUrlAsFile = function (url, fileName)
{
    let link = document.createElement ('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild (link);
    link.click ();
    document.body.removeChild (link);
};

OV.DownloadArrayBufferAsFile = function (arrayBuffer, fileName)
{
    let url = OV.CreateObjectUrl (arrayBuffer);
    OV.DownloadUrlAsFile (url, fileName);
};

OV.CreateSvgIcon = function (parent, iconName, extraClass)
{
    let div = $('<div>').addClass ('ov_svg_icon').appendTo (parent);
    $('<i>').addClass ('icon').addClass ('icon-' + iconName).appendTo (div);
    if (extraClass !== undefined && extraClass !== null) {
        div.addClass (extraClass);
    }
    return div;
};

OV.SetSvgIconImage = function (icon, iconName)
{
    icon.empty ();
    $('<i>').addClass ('icon').addClass ('icon-' + iconName).appendTo (icon);
};

OV.CreateHeaderButton = function (iconName, title, link)
{
    let buttonLink = $('<a>');
    buttonLink.attr ('href', link);
    buttonLink.attr ('target', '_blank');
    buttonLink.attr ('rel', 'noopener noreferrer');
    OV.InstallTooltip (buttonLink, title);
    OV.CreateSvgIcon (buttonLink, iconName, 'header_button');
    return buttonLink;
};

OV.CreateInlineColorCircle = function (color)
{
    let hexString = '#' + OV.ColorToHexString (color);
    let darkerColor = new OV.Color (
        Math.max (0, color.r - 50),
        Math.max (0, color.g - 50),
        Math.max (0, color.b - 50)
    );
    let darkerColorHexString = '#' + OV.ColorToHexString (darkerColor);
    return $('<div>').addClass ('ov_color_circle').css ('background', hexString).css ('border', '1px solid ' + darkerColorHexString);
};
