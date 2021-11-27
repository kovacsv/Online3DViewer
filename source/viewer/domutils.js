OV.GetInnerDimensions = function (element, outerWidth, outerHeight)
{
    function GetInt (parameter)
    {
        return Math.round (parseFloat (parameter));
    }

    let style = getComputedStyle (element);
    let width = outerWidth -
        GetInt (style.borderLeftWidth) - GetInt (style.borderRightWidth) -
        GetInt (style.marginLeft) - GetInt (style.marginRight) -
        GetInt (style.paddingLeft) - GetInt (style.paddingRight);
    let height = outerHeight -
        GetInt (style.borderTopWidth) - GetInt (style.borderBottomWidth) -
        GetInt (style.marginTop) - GetInt (style.marginBottom) -
        GetInt (style.paddingTop) - GetInt (style.paddingBottom);
    return {
        width : width,
        height : height
    };
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

OV.CreateDiv = function (className, innerHTML)
{
    return OV.CreateDomElement ('div', className, innerHTML);
};

OV.AddDiv = function (parentElement, className, innerHTML)
{
    return OV.AddDomElement (parentElement, 'div', className, innerHTML);
};

OV.InsertDomElementBefore = function (newElement, existingElement)
{
    existingElement.parentNode.insertBefore (newElement, existingElement);
};

OV.InsertDomElementAfter = function (newElement, existingElement)
{
    existingElement.parentNode.insertBefore (newElement, existingElement.nextSibling);
};

OV.ShowDomElement = function (element)
{
    element.style.display = '';
};

OV.HideDomElement = function (element)
{
    element.style.display = 'none';
};
