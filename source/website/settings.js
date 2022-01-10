import { Color } from '../engine/model/color.js';

export const Theme =
{
    Light : 1,
    Dark : 2
};

export class Settings
{
    constructor ()
    {
        this.backgroundColor = new Color (255, 255, 255);
        this.defaultColor = new Color (200, 200, 200);
        this.showGrid = false;
        this.showEdges = false;
        this.edgeColor = new Color (0, 0, 0);
        this.edgeThreshold = 1;
        this.themeId = Theme.Light;
    }

    LoadFromCookies (cookieHandler)
    {
        this.backgroundColor = cookieHandler.GetColorVal ('ov_background_color', new Color (255, 255, 255));
        this.defaultColor = cookieHandler.GetColorVal ('ov_default_color', new Color (200, 200, 200));
        this.showGrid = cookieHandler.GetBoolVal ('ov_show_grid', false);
        this.showEdges = cookieHandler.GetBoolVal ('ov_show_edges', false);
        this.edgeColor = cookieHandler.GetColorVal ('ov_edge_color', new Color (0, 0, 0));
        this.edgeThreshold = cookieHandler.GetIntVal ('ov_edge_threshold', 1);
        this.showEdges = cookieHandler.GetBoolVal ('ov_show_edges', false);
        this.themeId = cookieHandler.GetIntVal ('ov_theme_id', Theme.Light);
    }

    SaveToCookies (cookieHandler)
    {
        cookieHandler.SetColorVal ('ov_background_color', this.backgroundColor);
        cookieHandler.SetColorVal ('ov_default_color', this.defaultColor);
        cookieHandler.SetBoolVal ('ov_show_grid', this.showGrid);
        cookieHandler.SetBoolVal ('ov_show_edges', this.showEdges);
        cookieHandler.SetColorVal ('ov_edge_color', this.edgeColor);
        cookieHandler.SetIntVal ('ov_edge_threshold', this.edgeThreshold);
        cookieHandler.SetIntVal ('ov_theme_id', this.themeId);
    }
}
