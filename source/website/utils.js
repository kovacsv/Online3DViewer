import { Color, ColorToHexString } from '../engine/model/color.js';
import { CreateObjectUrl } from '../engine/io/bufferutils.js';
import { AddDiv, CreateDiv, AddDomElement, CreateDomElement, GetDomElementOuterWidth, SetDomElementOuterWidth } from '../engine/viewer/domutils.js';
import { CreateVerticalSplitter } from './splitter.js';

export function GetNameOrDefault (originalName, defaultName)
{
    if (originalName.length > 0) {
        return originalName;
    }
    return defaultName;
}

export function GetNodeName (originalName)
{
    return GetNameOrDefault (originalName, 'No Name');
}

export function GetMeshName (originalName)
{
    return GetNameOrDefault (originalName, 'No Name');
}

export function GetMaterialName (originalName)
{
    return GetNameOrDefault (originalName, 'No Name');
}

export function IsHoverEnabled ()
{
    return window.matchMedia ('(hover: hover)').matches;
}

export function AddSmallWidthChangeEventListener (onChange)
{
    let mediaQuery = window.matchMedia ('(max-width: 800px)');
    mediaQuery.addEventListener ('change', onChange);
}

export function IsSmallWidth ()
{
    return window.matchMedia ('(max-width: 800px)').matches;
}

export function IsSmallHeight ()
{
    return window.matchMedia ('(max-height: 800px)').matches;
}

export function InstallTooltip (element, text)
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

    if (!IsHoverEnabled ()) {
        return;
    }

    let tooltip = null;
    element.addEventListener ('mouseover', () => {
        tooltip = AddDiv (document.body, 'ov_tooltip', text);
        let offset = CalculateOffset (element, tooltip);
        tooltip.style.left = offset.left + 'px';
        tooltip.style.top = offset.top + 'px';
    });
    element.addEventListener ('mouseout', () => {
        tooltip.remove ();
    });
}

export function CopyToClipboard (text)
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
}

export function DownloadUrlAsFile (url, fileName)
{
    let link = document.createElement ('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild (link);
    link.click ();
    document.body.removeChild (link);
}

export function DownloadArrayBufferAsFile (arrayBuffer, fileName)
{
    let url = CreateObjectUrl (arrayBuffer);
    DownloadUrlAsFile (url, fileName);
}

export function CreateSvgIconElement (iconName, className)
{
    let iconDiv = CreateDiv ('ov_svg_icon');
    if (className) {
        iconDiv.classList.add (className);
    }
    AddDomElement (iconDiv, 'i', 'icon icon-' + iconName);
    return iconDiv;
}

export function AddSvgIconElement (parentElement, iconName, className)
{
    let iconDiv = CreateSvgIconElement (iconName, className);
    parentElement.appendChild (iconDiv);
    return iconDiv;
}

export function SetSvgIconImageElement (iconElement, iconName)
{
    let iconDiv = iconElement.firstChild;
    iconDiv.className = 'icon icon-' + iconName;
}

export function CreateInlineColorCircle (color)
{
    let hexString = '#' + ColorToHexString (color);
    let darkerColor = new Color (
        Math.max (0, color.r - 50),
        Math.max (0, color.g - 50),
        Math.max (0, color.b - 50)
    );
    let darkerColorHexString = '#' + ColorToHexString (darkerColor);
    let circleDiv = CreateDiv ('ov_color_circle');
    circleDiv.style.background = hexString;
    circleDiv.style.border = '1px solid ' + darkerColorHexString;
    return circleDiv;
}

export function InstallVerticalSplitter (splitterDiv, resizedDiv, flipped, onResize)
{
    let originalWidth = null;
    CreateVerticalSplitter (splitterDiv, {
        onSplitStart : () => {
            originalWidth = GetDomElementOuterWidth (resizedDiv);
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
            SetDomElementOuterWidth (resizedDiv, newWidth);
            onResize ();
        }
    });
}

export function GetFilesFromDataTransfer (dataTransfer, onReady)
{
    async function GetFileEntriesFromDirectory (dirEntry, fileEntries)
    {
        let reader = dirEntry.createReader ();
        return new Promise ((resolve, reject) => {
            reader.readEntries (
                async (dirEntries) => {
                    for (let entry of dirEntries) {
                        if (entry.isFile) {
                            fileEntries.push (entry);
                        } else if (entry.isDirectory) {
                            await GetFileEntriesFromDirectory (entry, fileEntries);
                        }
                    }
                    resolve ();
                },
                (error) => {
                    reject (error);
                }
            );
        });
    }

    async function GetFileObjectsFromEntries (entries, onReady)
    {
        let fileEntries = [];
        for (let entry of entries) {
            if (entry.isFile) {
                fileEntries.push (entry);
            } else if (entry.isDirectory) {
                await GetFileEntriesFromDirectory (entry, fileEntries);
            }
        }

        let fileObjects = await Promise.all (fileEntries.map ((fileEntry) => {
            return new Promise ((resolve, reject) => {
                fileEntry.file (
                    (file) => {
                        resolve (file);
                    },
                    (error) => {
                        reject (error);
                    }
                );
            });
        }));

        onReady (fileObjects);
    }

    let getAsEntryFunc = null;
    if (DataTransferItem) {
        if (DataTransferItem.prototype.getAsEntry) {
            getAsEntryFunc = DataTransferItem.prototype.getAsEntry;
        } else if (DataTransferItem.prototype.webkitGetAsEntry) {
            getAsEntryFunc = DataTransferItem.prototype.webkitGetAsEntry;
        }
    }

    if (getAsEntryFunc !== null) {
        let entries = [];
        for (let item of dataTransfer.items) {
            entries.push (getAsEntryFunc.call (item));
        }
        GetFileObjectsFromEntries (entries, (allEntries) => {
            onReady (allEntries);
        });
    } else {
        onReady (dataTransfer.files);
    }
}
