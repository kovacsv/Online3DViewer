import { Theme } from './settings.js';

export class ThemeHandler
{
    constructor () {
        this.css = {
            '--ov_foreground_color': {},
            '--ov_background_color': {},
            '--ov_disabled_foreground_color': {},
            '--ov_button_color': {},
            '--ov_button_hover_color': {},
            '--ov_button_text_color': {},
            '--ov_outline_button_color': {},
            '--ov_outline_button_hover_color': {},
            '--ov_outline_button_text_color': {},
            '--ov_icon_color': {},
            '--ov_light_icon_color': {},
            '--ov_selected_icon_color': {},
            '--ov_disabled_icon_color': {},
            '--ov_hover_color': {},
            '--ov_hover_text_color': {},
            '--ov_logo_text_color': {},
            '--ov_logo_border_color': {},
            '--ov_toolbar_background_color': {},
            '--ov_toolbar_selected_color': {},
            '--ov_toolbar_separator_color': {},
            '--ov_treeview_selected_color': {},
            '--ov_dialog_foreground_color': {},
            '--ov_dialog_background_color': {},
            '--ov_dialog_control_border_color': {},
            '--ov_border_color': {},
            '--ov_shadow': {}
        };
        let root = document.querySelector (':root');
        let style = window.getComputedStyle (root);
        for (let property in this.css) {
            if (Object.prototype.hasOwnProperty.call (this.css, property)) {
                this.css[property].light = style.getPropertyValue (property);
                this.css[property].dark = style.getPropertyValue (property + '_dark');
            }
        }
    }

    SwitchTheme (themeId)
    {
        let themeName = null;
        if (themeId === Theme.Light) {
            themeName = 'light';
        } else if (themeId === Theme.Dark) {
            themeName = 'dark';
        } else {
            return;
        }

        let root = document.querySelector (':root');
        for (let property in this.css) {
            if (Object.prototype.hasOwnProperty.call (this.css, property)) {
                let value = this.css[property][themeName];
                if (value !== undefined) {
                    root.style.setProperty (property, value);
                }
            }
        }
    }
}
