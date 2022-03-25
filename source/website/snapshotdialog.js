import { AddDiv, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddRadioButton } from '../website/utils.js';
import { ButtonDialog } from './dialog.js';
import { DownloadUrlAsFile } from './utils.js';
import { CookieGetStringVal, CookieSetStringVal } from './cookiehandler.js';
import { HandleEvent } from './eventhandler.js';

export function ShowSnapshotDialog (viewer)
{
    function AddSizeRadioButton (parentDiv, id, text, isSelected, onChange)
    {
        let line = AddDiv (parentDiv, 'ov_dialog_row');
        AddRadioButton (line, id, 'snapshot_size', text, isSelected, onChange);
    }

    function GetImageUrl (viewer, snapshotSize)
    {
        if (snapshotSize.size === null) {
            let size = viewer.GetImageSize ();
            return viewer.GetImageAsDataUrl (size.width, size.height);
        } else {
            return viewer.GetImageAsDataUrl (snapshotSize.size[0], snapshotSize.size[1]);
        }
    }

    function UpdatePreview (viewer, previewImage, snapshotSize)
    {
        let url = GetImageUrl (viewer, snapshotSize);
        previewImage.src = url;
    }

    let selectedIndex = 0;
    let sizes = [
        {
            name : 'Current size',
            size : null
        },
        {
            name : '1280 x 720',
            size : [1280, 720]
        },
        {
            name : '1920 x 1080',
            size : [1920, 1080]
        }
    ];

    let dialog = new ButtonDialog ();
    let contentDiv = dialog.Init ('Create Snapshot', [
        {
            name : 'Cancel',
            subClass : 'outline',
            onClick () {
                dialog.Close ();
            }
        },
        {
            name : 'Create',
            onClick () {
                dialog.Close ();
                HandleEvent ('snapshot_created', sizes[selectedIndex].name);
                let url = GetImageUrl (viewer, sizes[selectedIndex]);
                DownloadUrlAsFile (url, 'model.png');
            }
        }
    ]);

    let optionsDiv = AddDiv (contentDiv, 'ov_snapshot_dialog_left');
    let previewImage = CreateDomElement ('img', 'ov_snapshot_dialog_preview');

    let lastSnapshotSizeName = CookieGetStringVal ('ov_last_snapshot_size', sizes[1].name);
    for (let i = 0; i < sizes.length; i++) {
        if (lastSnapshotSizeName === sizes[i].name) {
            selectedIndex = i;
            break;
        }
    }

    for (let i = 0; i < sizes.length; i++) {
        let size = sizes[i];
        let selected = (i === selectedIndex);
        AddSizeRadioButton (optionsDiv, 'snapshot_' + i.toString (), size.name, selected, () => {
            selectedIndex = i;
            CookieSetStringVal ('ov_last_snapshot_size', size.name);
            UpdatePreview (viewer, previewImage, size);
        });
    }

    contentDiv.appendChild (previewImage);
    UpdatePreview (viewer, previewImage, sizes[selectedIndex]);

    dialog.Open ();
    return dialog;
}
