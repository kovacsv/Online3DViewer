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
