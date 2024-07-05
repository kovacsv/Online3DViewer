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
    let isPanning = false;
    let isOrbiting = false;
    let startMousePosition = { x: 0, y: 0 };
    let previewImage;
    let panOffset = { x: 0, y: 0 };
    let orbitOffset = { x: 0, y: 0 };
    let zoomSlider;
    
    // Log the camera object before opening the dialog
    const camera = viewer.navigation.GetCamera();
    const originalRotate = camera.eye.Rotate;
    console.log('Camera before opening dialog:', camera);
    console.log('Rotate method before opening dialog:', camera.eye.Rotate);

    function CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel, panOffset, orbitOffset) {
        const camera = viewer.navigation.GetCamera();
        
        // Store original camera state
        const originalCamera = {
            eye: { x: camera.eye.x, y: camera.eye.y, z: camera.eye.z },
            center: { x: camera.center.x, y: camera.center.y, z: camera.center.z },
            up: { x: camera.up.x, y: camera.up.y, z: camera.up.z }
        };
    
        // Apply zoom
        const direction = {
            x: camera.eye.x - camera.center.x,
            y: camera.eye.y - camera.center.y,
            z: camera.eye.z - camera.center.z
        };

        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        const zoomedDistance = distance * zoomLevel;
        const zoomFactor = zoomedDistance / distance;

        const zoomedEye = {
            x: camera.center.x + direction.x * zoomFactor,
            y: camera.center.y + direction.y * zoomFactor,
            z: camera.center.z + direction.z * zoomFactor
        };
    
        // Apply pan
        const panScale = distance * 0.001; // Adjust this value as needed
        const pannedCenter = {
            x: camera.center.x + camera.up.x * panOffset.y * panScale,
            y: camera.center.y + camera.up.y * panOffset.y * panScale,
            z: camera.center.z + camera.up.z * panOffset.y * panScale
        };
        const pannedEye = {
            x: zoomedEye.x + camera.up.x * panOffset.y * panScale,
            y: zoomedEye.y + camera.up.y * panOffset.y * panScale,
            z: zoomedEye.z + camera.up.z * panOffset.y * panScale
        };
    
        // Set temporary camera for snapshot
        camera.eye.x = pannedEye.x;
        camera.eye.y = pannedEye.y;
        camera.eye.z = pannedEye.z;
        camera.center.x = pannedCenter.x;
        camera.center.y = pannedCenter.y;
        camera.center.z = pannedCenter.z;
        viewer.navigation.MoveCamera(camera, 0);

        // Apply orbit
        viewer.navigation.Orbit(orbitOffset.x, orbitOffset.y);

        // Capture the image
        const imageDataUrl = viewer.GetImageAsDataUrl(width, height, isTransparent);

        // Restore original camera state
        camera.eye.x = originalCamera.eye.x;
        camera.eye.y = originalCamera.eye.y;
        camera.eye.z = originalCamera.eye.z;
        camera.center.x = originalCamera.center.x;
        camera.center.y = originalCamera.center.y;
        camera.center.z = originalCamera.center.z;
        camera.up.x = originalCamera.up.x;
        camera.up.y = originalCamera.up.y;
        camera.up.z = originalCamera.up.z;
        viewer.navigation.MoveCamera(camera, 0);
    
        return imageDataUrl;
    }

    function UpdatePreview(viewer, previewImage, width, height, isTransparent, zoomLevel, panOffset, orbitOffset) {
        console.log('Updating preview');
        let imageUrl = CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel, panOffset, orbitOffset);
        previewImage.src = imageUrl;
    }

    function HandlePreviewMouseMove(event) {
        if (!isPanning && !isOrbiting) return;
    
        const currentMousePosition = { x: event.clientX, y: event.clientY };
        const deltaX = currentMousePosition.x - startMousePosition.x;
        const deltaY = currentMousePosition.y - startMousePosition.y;
    
        if (isOrbiting) {
            const orbitRatio = 0.1; // Adjust this value as needed
            orbitOffset.x += deltaX * orbitRatio;
            orbitOffset.y += deltaY * orbitRatio;
        } else if (isPanning) {
            const panRatio = 0.1; // Adjust this value as needed
            panOffset.y -= deltaY * panRatio; // Only vertical panning for now
        }
    
        UpdatePreview(viewer, previewImage, snapshotWidth, snapshotHeight, false, zoomSlider.value, panOffset, orbitOffset);
    
        startMousePosition = currentMousePosition;
        event.preventDefault();
    }

    function HandlePreviewMouseUp(event) {
        console.log('HandlePreviewMouseUp');
        isPanning = false;
        isOrbiting = false;
        document.removeEventListener('mousemove', HandlePreviewMouseMove, true);
        document.removeEventListener('mouseup', HandlePreviewMouseUp, true);
        event.preventDefault();
    }

    function HandlePreviewMouseDown(event) {
        startMousePosition = { x: event.clientX, y: event.clientY };
        if (event.button === 0) { // Left button
            isOrbiting = true;
        } else if (event.button === 1 || event.button === 2) { // Middle button or right button
            isPanning = true;
        }
        document.addEventListener('mousemove', HandlePreviewMouseMove, true);
        document.addEventListener('mouseup', HandlePreviewMouseUp, true);
        event.preventDefault();
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
            previewImage = CreateDomElement('img', 'ov_snapshot_preview_image');
            snapshotPreviewContainer.appendChild(previewImage);

            // Add zoom slider
            let zoomSliderLabel = AddDiv(step1, 'ov_dialog_label', Loc('Zoom Level'));
            zoomSlider = AddDomElement(step1, 'input', 'zoomSlider');
            zoomSlider.setAttribute('type', 'range');
            zoomSlider.setAttribute('min', '0.1');
            zoomSlider.setAttribute('max', '3');
            zoomSlider.setAttribute('step', '0.1');
            zoomSlider.setAttribute('value', initialZoomLevel);
            zoomSlider.addEventListener('input', () => {
                UpdatePreview(viewer, previewImage, snapshotWidth, snapshotHeight, false, zoomSlider.value, panOffset, orbitOffset);
            });

            // Add mouse event listeners for panning and orbiting
            previewImage.addEventListener('mousedown', HandlePreviewMouseDown, true);

            // Set initial preview
            console.log('Initial preview');
            UpdatePreview(viewer, previewImage, snapshotWidth, snapshotHeight, false, zoomSlider.value, panOffset, orbitOffset);

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

    const originalClose = dialog.Close.bind(dialog);
    dialog.Close = function() {
        previewImage.removeEventListener('mousedown', HandlePreviewMouseDown, true);
        document.removeEventListener('mousemove', HandlePreviewMouseMove, true);
        document.removeEventListener('mouseup', HandlePreviewMouseUp, true);
        // Reassign the original Rotate method after closing the dialog
        camera.eye.Rotate = originalRotate;
    
        originalClose();
    
        // Log the camera object after closing the dialog
        console.log('Camera after closing dialog:', viewer.navigation.GetCamera());
        console.log('Rotate method after closing dialog:', camera.eye.Rotate);
    };

    dialog.Open();

    return dialog;
}
