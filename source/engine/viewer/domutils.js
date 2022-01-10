import { Coord2D } from '../geometry/coord2d.js';

export function GetIntegerFromStyle (parameter)
{
    return Math.round (parseFloat (parameter));
}

export function GetDomElementExternalWidth (style)
{
    let padding = GetIntegerFromStyle (style.paddingLeft) + GetIntegerFromStyle (style.paddingRight);
    let border = GetIntegerFromStyle (style.borderLeftWidth) + GetIntegerFromStyle (style.borderRightWidth);
    let margin = GetIntegerFromStyle (style.marginLeft) + GetIntegerFromStyle (style.marginRight);
    return padding + border + margin;
}

export function GetDomElementExternalHeight (style)
{
    let padding = GetIntegerFromStyle (style.paddingTop) + GetIntegerFromStyle (style.paddingBottom);
    let border = GetIntegerFromStyle (style.borderTopWidth) + GetIntegerFromStyle (style.borderBottomWidth);
    let margin = GetIntegerFromStyle (style.marginTop) + GetIntegerFromStyle (style.marginBottom);
    return padding + border + margin;
}

export function GetDomElementInnerDimensions (element, outerWidth, outerHeight)
{
    let style = getComputedStyle (element);
    let width = outerWidth - GetDomElementExternalWidth (style);
    let height = outerHeight - GetDomElementExternalHeight (style);
    return {
        width : width,
        height : height
    };
}

export function GetDomElementClientCoordinates (element, clientX, clientY)
{
    if (element.getBoundingClientRect) {
        let clientRect = element.getBoundingClientRect ();
        clientX -= clientRect.left;
        clientY -= clientRect.top;
    }
    if (window.pageXOffset && window.pageYOffset) {
        clientX += window.pageXOffset;
        clientY += window.pageYOffset;
    }
    return (new Coord2D (clientX, clientY));
}

export function CreateDomElement (elementType, className, innerHTML)
{
    let element = document.createElement (elementType);
    if (className) {
        element.className = className;
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
}

export function AddDomElement (parentElement, elementType, className, innerHTML)
{
    let element = CreateDomElement (elementType, className, innerHTML);
    parentElement.appendChild (element);
    return element;
}

export function AddDiv (parentElement, className, innerHTML)
{
    return AddDomElement (parentElement, 'div', className, innerHTML);
}

export function ClearDomElement (element)
{
    while (element.firstChild) {
        element.removeChild (element.firstChild);
    }
}

export function InsertDomElementBefore (newElement, existingElement)
{
    existingElement.parentNode.insertBefore (newElement, existingElement);
}

export function InsertDomElementAfter (newElement, existingElement)
{
    existingElement.parentNode.insertBefore (newElement, existingElement.nextSibling);
}

export function ShowDomElement (element, show)
{
    if (show) {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}

export function IsDomElementVisible (element)
{
    return element.offsetParent !== null;
}

export function SetDomElementWidth (element, width)
{
    element.style.width = width.toString () + 'px';
}

export function SetDomElementHeight (element, height)
{
    element.style.height = height.toString () + 'px';
}

export function GetDomElementOuterWidth (element)
{
    let style = getComputedStyle (element);
    return element.offsetWidth + GetIntegerFromStyle (style.marginLeft) + GetIntegerFromStyle (style.marginRight);
}

export function GetDomElementOuterHeight (element)
{
    let style = getComputedStyle (element);
    return element.offsetHeight + GetIntegerFromStyle (style.marginTop) + GetIntegerFromStyle (style.marginBottom);
}

export function SetDomElementOuterWidth (element, width)
{
    let style = getComputedStyle (element);
    SetDomElementWidth (element, width - GetDomElementExternalWidth (style));
}

export function SetDomElementOuterHeight (element, height)
{
    let style = getComputedStyle (element);
    SetDomElementHeight (element, height - GetDomElementExternalHeight (style));
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

export function CreateDiv (className, innerHTML)
{
    return CreateDomElement ('div', className, innerHTML);
}
