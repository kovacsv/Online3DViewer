import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';

export function ShowSharingDialog(settings, viewer) {
    function AddCheckboxLine(parentDiv, text, id, onChange) {
        let line = AddDiv(parentDiv, 'ov_dialog_row');
        let checkbox = AddCheckbox(line, id, text, true, () => {
            onChange(checkbox.checked);
        });
    }

    function GetImageUrl(viewer, width, height, isTransparent) {
        return viewer.GetImageAsDataUrl(width, height, isTransparent);
    }

    function UpdatePreview(viewer, previewImage, width, height, isTransparent) {
        let url = GetImageUrl(viewer, width, height, isTransparent);
        previewImage.src = url;
    }

    function AddPainSnapshotSharingTab(parentDiv) {
        function SendEmail(recipients, subject, body) {
            console.log('Sending email to:', recipients);
            // Implement email sending functionality
            // This might involve integrating with an email service provider API
        }

        function DownloadSnapshotAndInfo(snapshot, info) {
            console.log('Downloading snapshot and info')
            // Implement download functionality
            // This can involve creating a Blob from the snapshot and info, and triggering a download
        }

        function CreateMultiStepForm(parentDiv) {
            let formContainer = AddDiv(parentDiv, 'ov_dialog_form_container');
            let step1 = AddDiv(formContainer, 'ov_dialog_step');
            AddDiv(step1, 'ov_dialog_title', Loc('Share Snapshot'));

            let description = AddDiv(step1, 'ov_dialog_description', Loc('Quickly share a snapshot and details of your pain location with family, friends, or therapists.'));

            // Create email fields
            let emailFields = [];
            for (let i = 0; i < 3; i++) {
                let emailLabel = AddDiv(step1, 'ov_dialog_label', Loc(`Email ${i + 1}`));
                let emailInput = AddDomElement(step1, 'input', `email${i}`);
                emailInput.setAttribute('type', 'email');
                emailInput.setAttribute('class', 'ov_dialog_input');
                emailInput.setAttribute('placeholder', Loc('Enter email address'));
                emailFields.push(emailInput);
            }

            // Add snapshot preview
            let snapshotPreviewContainer = AddDiv(step1, 'ov_snapshot_preview_container');
            let previewImage = CreateDomElement('img', 'ov_snapshot_preview_image');
            snapshotPreviewContainer.appendChild(previewImage);

            // Set initial preview
            UpdatePreview(viewer, previewImage, 1920, 1080, false);

            let nextButton = AddDiv(step1, 'ov_button', Loc('Next'));
            nextButton.addEventListener('click', () => {
                let emails = emailFields.map(input => input.value.trim()).filter(email => email.length > 0);
                if (emails.length > 3) {
                    ShowMessageDialog(Loc('Error'), Loc('You can only send to up to 3 recipients.'));
                } else {
                    step1.style.display = 'none';
                    step2.style.display = 'block';
                }
            });

            let step2 = AddDiv(formContainer, 'ov_dialog_step');
            step2.style.display = 'none';
            AddDiv(step2, 'ov_dialog_title', Loc('Additional Options'));

            let sendToSelfCheckbox = AddCheckbox(step2, 'send_to_self', Loc('Send to myself'), false, () => {});
            let downloadCheckbox = AddCheckbox(step2, 'download_snapshot', Loc('Download snapshot and info'), false, () => {});

            let intensityLabel = AddDiv(step2, 'ov_dialog_label', Loc('Pain Intensity'));
            let intensityInput = AddDomElement(step2, 'input', null);
            intensityInput.setAttribute('type', 'number');
            intensityInput.setAttribute('min', '1');
            intensityInput.setAttribute('max', '10');
            intensityInput.setAttribute('class', 'ov_dialog_input');
            intensityInput.setAttribute('placeholder', Loc('Enter pain intensity (1-10)'));

            let durationLabel = AddDiv(step2, 'ov_dialog_label', Loc('Pain Duration'));
            let durationInput = AddDomElement(step2, 'input', null);
            durationInput.setAttribute('type', 'text');
            durationInput.setAttribute('class', 'ov_dialog_input');
            durationInput.setAttribute('placeholder', Loc('Enter pain duration (e.g., 2 hours, 3 days)'));

            let submitButton = AddDiv(step2, 'ov_button', Loc('Submit'));
            submitButton.addEventListener('click', () => {
                let snapshot = previewImage.src; // Use the preview image as the snapshot
                let info = {
                    intensity: intensityInput.value,
                    duration: durationInput.value,
                };

                let emails = emailFields.map(input => input.value.trim()).filter(email => email.length > 0);
                if (sendToSelfCheckbox.checked) {
                    emails.push('self@example.com'); // Replace with actual user's email
                }

                SendEmail(emails, 'Pain Snapshot', `Snapshot: ${snapshot}\nInfo: ${JSON.stringify(info)}`);
                if (downloadCheckbox.checked) {
                    DownloadSnapshotAndInfo(snapshot, info);
                }

                ShowMessageDialog(Loc('Success'), Loc('Your snapshot and information have been shared.'));
            });
        }

        CreateMultiStepForm(parentDiv);
    }

    let dialog = new ButtonDialog();
    let contentDiv = dialog.Init(Loc('Share'), [
        {
            name: Loc('Close'),
            onClick() {
                dialog.Close();
            }
        }
    ]);

    AddPainSnapshotSharingTab(contentDiv);

    dialog.Open();
    return dialog;
}
