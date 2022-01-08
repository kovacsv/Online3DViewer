OV.GetIntegerFromStyle = function (parameter)
{
    return Math.round (parseFloat (parameter));
};

OV.GetDomElementExternalWidth = function (style)
{
    let padding = OV.GetIntegerFromStyle (style.paddingLeft) + OV.GetIntegerFromStyle (style.paddingRight);
    let border = OV.GetIntegerFromStyle (style.borderLeftWidth) + OV.GetIntegerFromStyle (style.borderRightWidth);
    let margin = OV.GetIntegerFromStyle (style.marginLeft) + OV.GetIntegerFromStyle (style.marginRight);
    return padding + border + margin;
};

OV.GetDomElementExternalHeight = function (style)
{
    let padding = OV.GetIntegerFromStyle (style.paddingTop) + OV.GetIntegerFromStyle (style.paddingBottom);
    let border = OV.GetIntegerFromStyle (style.borderTopWidth) + OV.GetIntegerFromStyle (style.borderBottomWidth);
    let margin = OV.GetIntegerFromStyle (style.marginTop) + OV.GetIntegerFromStyle (style.marginBottom);
    return padding + border + margin;
};

OV.GetDomElementInnerDimensions = function (element, outerWidth, outerHeight)
{
    let style = getComputedStyle (element);
    let width = outerWidth - OV.GetDomElementExternalWidth (style);
    let height = outerHeight - OV.GetDomElementExternalHeight (style);
    return {
        width : width,
        height : height
    };
};

OV.GetDomElementClientCoordinates = function (element, clientX, clientY)
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
    return (new OV.Coord2D (clientX, clientY));
};

OV.CreateDomElement = function (elementType, className, innerHTML)
{
    let element = document.createElement (elementType);
    if (className) {
        element.className = className;
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
};

OV.AddDomElement = function (parentElement, elementType, className, innerHTML)
{
    let element = OV.CreateDomElement (elementType, className, innerHTML);
    parentElement.appendChild (element);
    return element;
};

OV.ClearDomElement = function (element)
{
    while (element.firstChild) {
        element.removeChild (element.firstChild);
    }
};

OV.InsertDomElementBefore = function (newElement, existingElement)
{
    existingElement.parentNode.insertBefore (newElement, existingElement);
};

OV.InsertDomElementAfter = function (newElement, existingElement)
{
    existingElement.parentNode.insertBefore (newElement, existingElement.nextSibling);
};

OV.ShowDomElement = function (element, show)
{
    if (show) {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
};

OV.IsDomElementVisible = function (element)
{
    return element.offsetParent !== null;
};

OV.SetDomElementWidth = function (element, width)
{
    element.style.width = width.toString () + 'px';
};

OV.SetDomElementHeight = function (element, height)
{
    element.style.height = height.toString () + 'px';
};

OV.GetDomElementOuterWidth = function (element)
{
    let style = getComputedStyle (element);
    return element.offsetWidth + OV.GetIntegerFromStyle (style.marginLeft) + OV.GetIntegerFromStyle (style.marginRight);
};

OV.GetDomElementOuterHeight = function (element)
{
    let style = getComputedStyle (element);
    return element.offsetHeight + OV.GetIntegerFromStyle (style.marginTop) + OV.GetIntegerFromStyle (style.marginBottom);
};

OV.SetDomElementOuterWidth = function (element, width)
{
    let style = getComputedStyle (element);
    OV.SetDomElementWidth (element, width - OV.GetDomElementExternalWidth (style));
};

OV.SetDomElementOuterHeight = function (element, height)
{
    let style = getComputedStyle (element);
    OV.SetDomElementHeight (element, height - OV.GetDomElementExternalHeight (style));
};

OV.AddRadioButton = function (parentElement, name, id, text, onChange)
{
    let label = OV.AddDomElement (parentElement, 'label');
    label.setAttribute ('for', id);
    let radio = OV.AddDomElement (label, 'input', 'ov_radio_button');
    radio.setAttribute ('type', 'radio');
    radio.setAttribute ('id', id);
    radio.setAttribute ('name', name);
    OV.AddDomElement (label, 'span', null, text);
    if (onChange) {
        radio.addEventListener ('change', onChange);
    }
    return radio;
};

OV.AddCheckbox = function (parentElement, id, text, isChecked, onChange)
{
    let label = OV.AddDomElement (parentElement, 'label');
    label.setAttribute ('for', id);
    let check = OV.AddDomElement (label, 'input', 'ov_checkbox');
    check.setAttribute ('type', 'checkbox');
    check.setAttribute ('id', id);
    check.checked = isChecked;
    OV.AddDomElement (label, 'span', null, text);
    if (onChange) {
        check.addEventListener ('change', onChange);
    }
    return check;
};

OV.AddRangeSlider = function (parentElement, min, max)
{
    let slider = OV.AddDomElement (parentElement, 'input', 'ov_slider');
    slider.setAttribute ('type', 'range');
    slider.setAttribute ('min', min.toString ());
    slider.setAttribute ('max', max.toString ());
    return slider;
};

OV.AddSelect = function (parentElement, options, selectedIndex, onChange)
{
    let container = OV.AddDiv (parentElement, 'ov_select_container');
    let select = OV.AddDomElement (container, 'select', 'ov_select');
    for (let option of options) {
        OV.AddDomElement (select, 'option', null, option);
    }
    select.selectedIndex = selectedIndex;
    if (onChange) {
        select.addEventListener ('change', () => {
            onChange (select.selectedIndex);
        });
    }
    return select;
};

OV.AddToggle = function (parentElement, className)
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
    let toggle = OV.AddDiv (parentElement, toggleClassName);
    OV.AddDiv (toggle, 'ov_toggle_slider');

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
};

OV.CreateDiv = function (className, innerHTML)
{
    return OV.CreateDomElement ('div', className, innerHTML);
};

OV.AddDiv = function (parentElement, className, innerHTML)
{
    return OV.AddDomElement (parentElement, 'div', className, innerHTML);
};
