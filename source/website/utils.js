import { RGBColor, RGBColorToHexString } from '../engine/model/color.js';
import { CreateObjectUrl } from '../engine/io/bufferutils.js';
import { AddDiv, CreateDiv, AddDomElement } from '../engine/viewer/domutils.js';

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

export function GetMeshName (originalNodeName, originalMeshName)
{
    let originalName = (originalNodeName.length > 0 ? originalNodeName : originalMeshName);
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
    let hexString = '#' + RGBColorToHexString (color);
    let darkerColor = new RGBColor (
        Math.max (0, color.r - 50),
        Math.max (0, color.g - 50),
        Math.max (0, color.b - 50)
    );
    let darkerColorHexString = '#' + RGBColorToHexString (darkerColor);
    let circleDiv = CreateDiv ('ov_color_circle');
    circleDiv.style.background = hexString;
    circleDiv.style.border = '1px solid ' + darkerColorHexString;
    return circleDiv;
}

export function IsDarkTextNeededForColor (color)
{
    let intensity = color.r * 0.299 + color.g * 0.587 + color.b * 0.114;
    return intensity > 186.0;
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
            let entry = getAsEntryFunc.call (item);
            if (entry !== null) {
                entries.push (entry);
            }
        }
        GetFileObjectsFromEntries (entries, (allEntries) => {
            onReady (allEntries);
        });
    } else {
        onReady (dataTransfer.files);
    }
}

export function AddNumberInput (parentElement, className, onChange)
{
    let numberInput = AddDomElement (parentElement, 'input', className);
    numberInput.setAttribute ('type', 'text');
    let onChangeTimeout = null;
    numberInput.addEventListener ('input', () => {
        numberInput.value = numberInput.value.replace (/[^0-9]/g, '');
        if (onChange) {
            if (onChangeTimeout !== null) {
                clearTimeout (onChangeTimeout);
            }
            onChangeTimeout = setTimeout (() => {
                onChange (numberInput.value);
            }, 1000);
        }
    });
    return numberInput;
}

export function AddCheckbox (parentElement, id, text, isChecked, onChange)
{
    let label = AddDomElement (parentElement, 'label');
    label.setAttribute ('for', id);
    let check = AddDomElement (label, 'input', 'ov_checkbox');
    check.setAttribute ('type', 'checkbox');
    check.setAttribute ('id', id);
    check.checked = isChecked;
    AddDomElement (label, 'span', null, text);
    if (onChange) {
        check.addEventListener ('change', onChange);
    }
    return check;
}

export function AddRadioButton (parentElement, id, name, text, isChecked, onChange)
{
    let label = AddDomElement (parentElement, 'label');
    label.setAttribute ('for', id);
    let radio = AddDomElement (label, 'input', 'ov_radio_button');
    radio.setAttribute ('type', 'radio');
    radio.setAttribute ('id', id);
    radio.setAttribute ('name', name);
    radio.checked = isChecked;
    AddDomElement (label, 'span', null, text);
    if (onChange) {
        radio.addEventListener ('change', onChange);
    }
    return radio;
}

export function AddRangeSlider (parentElement, min, max)
{
    let slider = AddDomElement (parentElement, 'input', 'ov_slider');
    slider.setAttribute ('type', 'range');
    slider.setAttribute ('min', min.toString ());
    slider.setAttribute ('max', max.toString ());
    return slider;
}

export function AddSelect (parentElement, options, selectedIndex, onChange)
{
    let container = AddDiv (parentElement, 'ov_select_container');
    let select = AddDomElement (container, 'select', 'ov_select');
    for (let option of options) {
        AddDomElement (select, 'option', null, option);
    }
    select.selectedIndex = selectedIndex;
    if (onChange) {
        select.addEventListener ('change', () => {
            onChange (select.selectedIndex);
        });
    }
    return select;
}

export function AddToggle (parentElement, className)
{
    function UpdateStatus (toggle, status)
    {
        if (status) {
            toggle.classList.add ('on');
        } else {
            toggle.classList.remove ('on');
        }
    }

    let status = false;
    let onChange = null;

    let toggleClassName = 'ov_toggle';
    if (className) {
        toggleClassName += ' ' + className;
    }
    let toggle = AddDiv (parentElement, toggleClassName);
    AddDiv (toggle, 'ov_toggle_slider');

    toggle.addEventListener ('click', () => {
        status = !status;
        UpdateStatus (toggle, status);
        if (onChange) {
            onChange ();
        }
    });

    return {
        element : toggle,
        GetStatus : () => {
            return status;
        },
        SetStatus : (newStatus) => {
            status = newStatus;
            UpdateStatus (toggle, status);
        },
        OnChange : (onChangeHandler) => {
            onChange = onChangeHandler;
        }
    };
}
