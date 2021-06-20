OV.PropertyType =
{
    Text : 1
};

OV.Sidebar = class
{
    constructor (parentDiv)
    {
        this.parentDiv = parentDiv;
        this.titleDiv = $('<div>').addClass ('ov_sidebar_title').addClass ('ov_thin_scrollbar').appendTo (parentDiv);
        this.titleDiv.html ('Details');
        this.contentDiv = $('<div>').appendTo (parentDiv);
    }

    
};
