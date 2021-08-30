OV.ThemeHandler = class {
    constructor () {
        this.css = {
            '--ov_foreground_color': {
                'dark' : '#fafafa'
            },
            '--ov_background_color': {
                'dark' : '#2a2b2e',
            },
            '--ov_button_color': {
                'dark' : '#3393bd',
            },
            '--ov_button_hover_color': {
                'dark' : '#146a8f',
            },
            '--ov_button_text_color': {
                'dark' : '#ffffff',
            },
            '--ov_outline_button_color': {
                'dark' : '#c9e5f8',
            },
            '--ov_outline_button_hover_color': {
                'dark' : '#2a2b2e',
            },
            '--ov_outline_button_text_color': {
                'dark' : '#c9e5f8',
            },
            '--ov_icon_color': {
                'dark' : '#fafafa',
            },
            '--ov_hover_color': {
                'dark' : '#667c86',
            },
            '--ov_light_icon_color': {
                'dark' : '#dadada',
            },
            '--ov_logo_text_color': {
                'dark' : '#fafafa',
            },
            '--ov_logo_border_color': {
                'dark' : '#2a2b2e',                
            },
            '--ov_toolbar_background_color': {
                'dark' : '#3d3e42',
            },
            '--ov_toolbar_selected_color': {
                'dark' : '#272727',
            },
            '--ov_toolbar_separator_color': {
                'dark' : '#888888',
            },
            '--ov_treeview_selected_color': {
                'dark' : '#38393d',
            },
            '--ov_dialog_foreground_color': {
                'dark' : '#fafafa',
            },
            '--ov_dialog_background_color': {
                'dark' : '#333333',
            },
            '--ov_border_color': {
                'dark' : '#444444',
            },
            '--ov_shadow': {
                'dark' : '0px 0px 10px #111111'
            }
        };
        let root = document.querySelector (':root');
        let style = window.getComputedStyle (root);
        for (let property in this.css) {
            if (Object.prototype.hasOwnProperty.call (this.css, property)) {
                this.css[property].light = style.getPropertyValue (property);
            }
        }
    }

    SwitchTheme (name)
    {
        let root = document.querySelector (':root');
        for (let property in this.css) {
            if (Object.prototype.hasOwnProperty.call (this.css, property)) {
                let value = this.css[property][name];
                if (value !== undefined) {
                    root.style.setProperty (property, value);
                }
            }
        }
    }
};
