import { Color } from '../engine/model/color.js';
import { CookieGetBoolVal, CookieGetColorVal, CookieGetIntVal, CookieGetStringVal, CookieSetBoolVal, CookieSetColorVal, CookieSetIntVal, CookieSetStringVal } from './cookiehandler.js';

export const Theme =
{
    Light : 1,
    Dark : 2
};

export class Settings
{
    constructor ()
    {
        this.environmentMapName = 'fishermans_bastion';
        this.backgroundIsEnvMap = false;
        this.backgroundColor = new Color (255, 255, 255);
        this.defaultColor = new Color (200, 200, 200);
        this.showEdges = false;
        this.edgeColor = new Color (0, 0, 0);
        this.edgeThreshold = 1;
        this.themeId = Theme.Light;
    }

    LoadFromCookies ()
    {
        this.environmentMapName = CookieGetStringVal ('ov_environment_map', 'fishermans_bastion');
        this.backgroundIsEnvMap = CookieGetBoolVal ('ov_background_is_envmap', false);
        this.backgroundColor = CookieGetColorVal ('ov_background_color', new Color (255, 255, 255));
        this.defaultColor = CookieGetColorVal ('ov_default_color', new Color (200, 200, 200));
        this.showEdges = CookieGetBoolVal ('ov_show_edges', false);
        this.edgeColor = CookieGetColorVal ('ov_edge_color', new Color (0, 0, 0));
        this.edgeThreshold = CookieGetIntVal ('ov_edge_threshold', 1);
        this.themeId = CookieGetIntVal ('ov_theme_id', Theme.Light);
    }

    SaveToCookies ()
    {
        CookieSetStringVal ('ov_environment_map', this.environmentMapName);
        CookieSetBoolVal ('ov_background_is_envmap', this.backgroundIsEnvMap);
        CookieSetColorVal ('ov_background_color', this.backgroundColor);
        CookieSetColorVal ('ov_default_color', this.defaultColor);
        CookieSetBoolVal ('ov_show_edges', this.showEdges);
        CookieSetColorVal ('ov_edge_color', this.edgeColor);
        CookieSetIntVal ('ov_edge_threshold', this.edgeThreshold);
        CookieSetIntVal ('ov_theme_id', this.themeId);
    }
}
