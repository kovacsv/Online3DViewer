OV.GetNameOrDefault = function (originalName, defaultName)
{
    if (originalName.length > 0) {
        return originalName;
    }
    return defaultName;
};

OV.GetNodeName = function (originalName)
{
    return OV.GetNameOrDefault (originalName, 'No Name');
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
    return window.matchMedia ('(hover: hover)').matches;
};

OV.IsSmallWidth = function ()
{
    return window.matchMedia ('(max-width: 800px)').matches;
};

OV.IsSmallHeight = function ()
{
    return window.matchMedia ('(max-height: 800px)').matches;
};

OV.InstallTooltip = function (element, text)
{
    function CalculateOffset (element, tooltip)
    {
        let windowWidth = window.innerWidth;

        let elementOffset = element.getBoundingClientRect ();
        let elementWidth = element.offsetWidth;
        let elementHeight = element.offsetHeight;
        let tooltipWidth = tooltip.offsetWidth;

        let tooltipMargin = 10;
        let left = elementOffset.left + elementWidth / 2 - tooltipWidth / 2;
        if (left + tooltipWidth > windowWidth - tooltipMargin) {
            left = windowWidth - tooltipWidth - tooltipMargin;
        }
        if (left < tooltipMargin) {
            left = tooltipMargin;
        }
        left = Math.max (left, 0);
        return {
            left : left,
            top : elementOffset.top + elementHeight + tooltipMargin
        };
    }

    if (!OV.IsHoverEnabled ()) {
        return;
    }

    let bodyObj = $(document.body);
    let tooltip = null;
    element.addEventListener ('mouseover', () => {
        tooltip = OV.AddDiv (document.body, 'ov_tooltip', text);
        let offset = CalculateOffset (element, tooltip);
        tooltip.style.left = offset.left + 'px';
        tooltip.style.top = offset.top + 'px';
    });
    element.addEventListener ('mouseout', () => {
        tooltip.remove ();
    });
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

OV.CreateSvgIcon = function (iconName, extraClass)
{
    let div = $('<div>').addClass ('ov_svg_icon');
    $('<i>').addClass ('icon').addClass ('icon-' + iconName).appendTo (div);
    if (extraClass !== undefined && extraClass !== null) {
        div.addClass (extraClass);
    }
    return div;
};

OV.AddSvgIcon = function (parent, iconName, extraClass)
{
    let div = OV.CreateSvgIcon (iconName, extraClass);
    div.appendTo (parent);
    return div;
};

OV.SetSvgIconImage = function (icon, iconName)
{
    let iconChild = icon.children (':first');
    iconChild.removeClass ().addClass ('icon').addClass ('icon-' + iconName);
};

OV.CreateSvgIconElement = function (iconName, className)
{
    let iconDiv = OV.CreateDiv ('ov_svg_icon');
    if (className) {
        iconDiv.className = className;
    }
    OV.AddDomElement (iconDiv, 'i', 'icon icon-' + iconName);
    return iconDiv;
};

OV.AddSvgIconElement = function (parentElement, iconName, className)
{
    let iconDiv = OV.CreateSvgIconElement (iconName, className);
    parentElement.appendChild (iconDiv);
    return iconDiv;
};

OV.SetSvgIconImageElement = function (iconElement, iconName)
{
    let iconDiv = iconElement.firstChild;
    iconDiv.className = 'icon icon-' + iconName;
};

OV.CreateHeaderButton = function (iconName, title, link)
{
    let buttonLink = OV.CreateDomElement ('a');
    buttonLink.setAttribute ('href', link);
    buttonLink.setAttribute ('target', '_blank');
    buttonLink.setAttribute ('rel', 'noopener noreferrer');
    OV.InstallTooltip (buttonLink, title);
    OV.AddSvgIconElement (buttonLink, iconName, 'header_button');
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

OV.InstallVerticalSplitter = function (splitterDiv, resizedDiv, flipped, onResize)
{
    let originalWidth = null;
    OV.CreateVerticalSplitter (splitterDiv, {
        onSplitStart : () => {
            originalWidth = resizedDiv.outerWidth (true);
        },
        onSplit : (xDiff) => {
            const minWidth = 280;
            const maxWidth = 450;
            let newWidth = 0;
            if (flipped) {
                newWidth = originalWidth - xDiff;
            } else {
                newWidth = originalWidth + xDiff;
            }
            if (newWidth < minWidth) {
                newWidth = minWidth;
            } else if (newWidth > maxWidth)  {
                newWidth = maxWidth;
            }
            resizedDiv.outerWidth (newWidth, true);
            onResize ();
        }
    });
};
