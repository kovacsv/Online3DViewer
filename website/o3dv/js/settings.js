OV.Theme = {
    Light : 1,
    Dark : 2
};

OV.Settings = class
{
    constructor ()
    {
        this.backgroundColor = new OV.Color (255, 255, 255);
        this.defaultColor = new OV.Color (200, 200, 200);
        this.showEdges = false;
        this.edgeColor = new OV.Color (0, 0, 0);
        this.edgeThreshold = 1;
        this.themeId = OV.Theme.Light;
    }

    LoadFromCookies (cookieHandler)
    {
        this.backgroundColor = cookieHandler.GetColorVal ('ov_background_color', new OV.Color (255, 255, 255));
        this.defaultColor = cookieHandler.GetColorVal ('ov_default_color', new OV.Color (200, 200, 200));
        this.showEdges = cookieHandler.GetBoolVal ('ov_show_edges', false);
        this.edgeColor = cookieHandler.GetColorVal ('ov_edge_color', new OV.Color (0, 0, 0));
        this.edgeThreshold = cookieHandler.GetIntVal ('ov_edge_threshold', 1);
        this.showEdges = cookieHandler.GetBoolVal ('ov_show_edges', false);
        this.themeId = cookieHandler.GetIntVal ('ov_theme_id', OV.Theme.Light);
    }

    SaveToCookies (cookieHandler)
    {
        cookieHandler.SetColorVal ('ov_background_color', this.backgroundColor);
        cookieHandler.SetColorVal ('ov_default_color', this.defaultColor);
        cookieHandler.SetBoolVal ('ov_show_edges', this.showEdges);
        cookieHandler.SetColorVal ('ov_edge_color', this.edgeColor);
        cookieHandler.SetIntVal ('ov_edge_threshold', this.edgeThreshold);
        cookieHandler.SetIntVal ('ov_theme_id', this.themeId);
    }
};
