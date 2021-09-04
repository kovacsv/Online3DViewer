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
        this.themeId = OV.Theme.Light;
    }

    LoadFromCookies (cookieHandler)
    {
        this.backgroundColor = cookieHandler.GetColorVal ('ov_background_color', new OV.Color (255, 255, 255));
        this.defaultColor = cookieHandler.GetColorVal ('ov_default_color', new OV.Color (200, 200, 200));
        this.themeId = cookieHandler.GetIntVal ('ov_theme_id', OV.Theme.Light);
    }

    SaveToCookies (cookieHandler)
    {
        cookieHandler.SetColorVal ('ov_background_color', this.backgroundColor);
        cookieHandler.SetColorVal ('ov_default_color', this.defaultColor);
        cookieHandler.SetStringVal ('ov_theme_id', this.themeId);
    }
};
