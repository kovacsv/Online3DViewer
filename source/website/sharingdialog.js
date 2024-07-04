import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';

export function ShowSharingDialog(settings, viewer) {
    const snapshotWidth = 1920;
    const snapshotHeight = 1080;
    const initialZoomLevel = settings.snapshotZoomLevel || 1.5; // Default zoom level

    function AddCheckboxLine(parentDiv, text, id, onChange) {
        let line = AddDiv(parentDiv, 'ov_dialog_row');
        let checkbox = AddCheckbox(line, id, text, true, () => {
            onChange(checkbox.checked);
        });
    }

    function CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel) {
        const camera = viewer.navigation.GetCamera();
        const originalEyePosition = { ...camera.eye };
        const originalCenterPosition = { ...camera.center };

        // Calculate the direction vector from center to eye
        const direction = {
            x: camera.eye.x - camera.center.x,
            y: camera.eye.y - camera.center.y,
            z: camera.eye.z - camera.center.z
        };

        // Scale the direction vector by the zoom level
        direction.x *= zoomLevel;
        direction.y *= zoomLevel;
        direction.z *= zoomLevel;

        // Adjust the camera eye position
        camera.eye.x = camera.center.x + direction.x;
        camera.eye.y = camera.center.y + direction.y;
        camera.eye.z = camera.center.z + direction.z;
        viewer.navigation.MoveCamera(camera, 0); // Ensure the viewer updates the camera position

        // Capture the image as a Data URL
        const imageDataUrl = viewer.GetImageAsDataUrl(width, height, isTransparent);

        // Restore the original camera position
        camera.eye = originalEyePosition;
        camera.center = originalCenterPosition;
        viewer.navigation.MoveCamera(camera, 0);

        return imageDataUrl;
    }

    function UpdatePreview(viewer, previewImage, width, height, isTransparent, zoomLevel) {
        let imageUrl = CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel);
        previewImage.src = imageUrl;
    }

    function AddPainSnapshotSharingTab(parentDiv) {
        function SendEmail(recipients, subject, body) {
            console.log('Sending email to:', recipients);
            // Implement email sending functionality
            // This might involve integrating with an email service provider API
        }

        function DownloadSnapshotAndInfo(snapshot, info) {
            console.log('Downloading snapshot and info');
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

            // Add zoom slider
            let zoomSliderLabel = AddDiv(step1, 'ov_dialog_label', Loc('Zoom Level'));
            let zoomSlider = AddDomElement(step1, 'input', 'zoomSlider');
            zoomSlider.setAttribute('type', 'range');
            zoomSlider.setAttribute('min', '0.1');
            zoomSlider.setAttribute('max', '3');
            zoomSlider.setAttribute('step', '0.1');
            zoomSlider.setAttribute('value', initialZoomLevel);
            zoomSlider.addEventListener('input', () => {
                UpdatePreview(viewer, previewImage, snapshotWidth, snapshotHeight, false, zoomSlider.value);
            });

            // Set initial preview
            UpdatePreview(viewer, previewImage, snapshotWidth, snapshotHeight, false, initialZoomLevel);

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
