OV.ThemeHandler = class {
    constructor () {
        this.themes = {
            'light' : {
                'css' : {
                    '--ov_foreground_color': '#000000',
                    '--ov_background_color': '#ffffff',
                    '--ov_primary_color': '#3393bd',
                    '--ov_primary_hover_color': '#146a8f',
                    '--ov_secondary_color': '#ffffff',
                    '--ov_secondary_hover_color': '#e4f4ff',
                    '--ov_icon_color': '#263238',
                    '--ov_light_icon_color': '#838383',
                    '--ov_logo_text_color': '#15334a',
                    '--ov_logo_border_color': '#000000',                
                    '--ov_toolbar_background_color': '#f5f5f5',
                    '--ov_toolbar_selected_background_color': '#e1e1e1',
                    '--ov_dialog_foreground_color': '#000000',
                    '--ov_dialog_background_color': '#ffffff',
                    '--ov_border_color': '#cccccc',
                    '--ov_light_border_color': '#dddddd',
                    '--ov_shadow': '0px 0px 10px #cccccc',
                    '--ov_small_shadow': '0px 0px 3px #cccccc'
                }
            },
            'dark' : {
                'css' : {
                    '--ov_foreground_color': '#fafafa',
                    '--ov_background_color': '#222222',
                    '--ov_primary_color': '#3393bd',
                    '--ov_primary_hover_color': '#146a8f',
                    '--ov_secondary_color': '#ffffff',
                    '--ov_secondary_hover_color': '#e4f4ff',
                    '--ov_icon_color': '#fafafa',
                    '--ov_light_icon_color': '#dadada',
                    '--ov_logo_text_color': '#fafafa',
                    '--ov_logo_border_color': '#fafafa',                
                    '--ov_toolbar_background_color': '#333333',
                    '--ov_toolbar_selected_background_color': '#444444',
                    '--ov_dialog_foreground_color': '#fafafa',
                    '--ov_dialog_background_color': '#333333',
                    '--ov_border_color': '#444444',
                    '--ov_light_border_color': '#333333',
                    '--ov_shadow': 'none',
                    '--ov_small_shadow': 'none'
                }
            }
        };
    }

    SwitchTheme (name)
    {
        let theme = this.themes[name];
        if (theme === undefined) {
            return;
        }

        let root = document.querySelector (':root');
        for (let property in theme.css) {
            if (Object.prototype.hasOwnProperty.call (theme.css, property)) {
                root.style.setProperty (property, theme.css[property]);
            }
        }
    }
};
