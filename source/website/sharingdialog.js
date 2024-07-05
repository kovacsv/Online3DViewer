import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';

export function ShowSharingDialog(settings, viewer) {
    const SnapshotManager = createSnapshotManager(viewer, settings);
    const DialogManager = createDialogManager(SnapshotManager);
    DialogManager.showDialog();
}

function createSnapshotManager(viewer, settings) {
    const snapshotWidth = 1920;
    const snapshotHeight = 1080;
    const initialZoomLevel = settings.snapshotZoomLevel || 1.5;

    let isPanning = false;
    let isOrbiting = false;
    let startMousePosition = { x: 0, y: 0 };
    let previewImage;
    let panOffset = { x: 0, y: 0 };
    let orbitOffset = { x: 0, y: 0 };
    let currentZoomLevel = initialZoomLevel;
    
    const camera = viewer.navigation.GetCamera();
    const originalRotate = camera.eye.Rotate;

    function captureSnapshot(isTransparent) {
        return CaptureSnapshot(viewer, snapshotWidth, snapshotHeight, isTransparent, currentZoomLevel, panOffset, orbitOffset);
    }

    function updatePreview() {
        let imageUrl = captureSnapshot(false);
        previewImage.src = imageUrl;
    }

    function handlePreviewMouseMove(event) {
        if (!isPanning && !isOrbiting) return;
    
        const currentMousePosition = { x: event.clientX, y: event.clientY };
        const deltaX = currentMousePosition.x - startMousePosition.x;
        const deltaY = currentMousePosition.y - startMousePosition.y;
    
        if (isOrbiting) {
            const orbitRatio = 0.1;
            orbitOffset.x += deltaX * orbitRatio;
            orbitOffset.y += deltaY * orbitRatio;
        } else if (isPanning) {
            const panRatio = 0.075;
            panOffset.x -= deltaX * panRatio;
            panOffset.y -= deltaY * panRatio;
        }
    
        updatePreview();
    
        startMousePosition = currentMousePosition;
        event.preventDefault();
    }

    function handlePreviewMouseUp(event) {
        isPanning = false;
        isOrbiting = false;
        document.removeEventListener('mousemove', handlePreviewMouseMove, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp, true);
        event.preventDefault();
    }

    function handlePreviewMouseDown(event) {
        startMousePosition = { x: event.clientX, y: event.clientY };
        if (event.button === 0) {
            isOrbiting = true;
        } else if (event.button === 1 || event.button === 2) {
            isPanning = true;
        }
        document.addEventListener('mousemove', handlePreviewMouseMove, true);
        document.addEventListener('mouseup', handlePreviewMouseUp, true);
        event.preventDefault();
    }

    function handleMouseWheel(event) {
        const zoomSpeed = 0.001;
        currentZoomLevel += event.deltaY * zoomSpeed;
        currentZoomLevel = Math.min(Math.max(currentZoomLevel, 0.1), 3);
        updatePreview();
        event.preventDefault();
    }

    function initializePreviewImage(container) {
        previewImage = CreateDomElement('img', 'ov_snapshot_preview_image');
        container.appendChild(previewImage);
        previewImage.addEventListener('wheel', handleMouseWheel, true);
        previewImage.addEventListener('mousedown', handlePreviewMouseDown, true);
        updatePreview();
    }

    function cleanup() {
        previewImage.removeEventListener('mousedown', handlePreviewMouseDown, true);
        document.removeEventListener('mousemove', handlePreviewMouseMove, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp, true);
        previewImage.removeEventListener('wheel', handleMouseWheel, true);
        camera.eye.Rotate = originalRotate;
    }

    return {
        initializePreviewImage,
        cleanup,
        captureSnapshot
    };
}

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
    const panScale = distance * 0.005; // Adjust this value as needed
    const right = {
        x: direction.y * camera.up.z - direction.z * camera.up.y,
        y: direction.z * camera.up.x - direction.x * camera.up.z,
        z: direction.x * camera.up.y - direction.y * camera.up.x
    };
    const rightLength = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z);
    const normalizedRight = {
        x: right.x / rightLength,
        y: right.y / rightLength,
        z: right.z / rightLength
    };

    const pannedCenter = {
        x: camera.center.x + normalizedRight.x * panOffset.x * panScale + camera.up.x * panOffset.y * panScale,
        y: camera.center.y + normalizedRight.y * panOffset.x * panScale + camera.up.y * panOffset.y * panScale,
        z: camera.center.z + normalizedRight.z * panOffset.x * panScale + camera.up.z * panOffset.y * panScale
    };
    const pannedEye = {
        x: zoomedEye.x + normalizedRight.x * panOffset.x * panScale + camera.up.x * panOffset.y * panScale,
        y: zoomedEye.y + normalizedRight.y * panOffset.x * panScale + camera.up.y * panOffset.y * panScale,
        z: zoomedEye.z + normalizedRight.z * panOffset.x * panScale + camera.up.z * panOffset.y * panScale
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

function createDialogManager(SnapshotManager) {
    function createMultiStepForm(parentDiv) {
        let formContainer = AddDiv(parentDiv, 'ov_dialog_form_container');
        let step1 = createStep1(formContainer);
        let step2 = createStep2(formContainer);

        return { step1, step2 };
    }

    function createStep1(container) {
        let step1 = AddDiv(container, 'ov_dialog_step');

        AddDiv(step1, 'ov_dialog_title', Loc('Share Snapshot'));
        AddDiv(step1, 'ov_dialog_description', Loc('Quickly share a snapshot and details of your pain location with family, friends, or therapists.'));

        let emailFields = [];
        for (let i = 0; i < 3; i++) {
            AddDiv(step1, 'ov_dialog_label', Loc(`Email ${i + 1}`));
            let emailInput = AddDomElement(step1, 'input', `email${i}`);
            emailInput.setAttribute('type', 'email');
            emailInput.setAttribute('class', 'ov_dialog_input');
            emailInput.setAttribute('placeholder', Loc('Enter email address'));
            emailFields.push(emailInput);
        }

        let snapshotPreviewContainer = AddDiv(step1, 'ov_snapshot_preview_container');
        SnapshotManager.initializePreviewImage(snapshotPreviewContainer);

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

        return step1;
    }

    function createStep2(container) {
        let step2 = AddDiv(container, 'ov_dialog_step');
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
            let snapshot = SnapshotManager.captureSnapshot(false);
            let info = {
                intensity: intensityInput.value,
                duration: durationInput.value,
            };

            // Here you would implement the actual sharing logic
            console.log('Sharing snapshot:', snapshot);
            console.log('Sharing info:', info);

            ShowMessageDialog(Loc('Success'), Loc('Your snapshot and information have been shared.'));
        });

        return step2;
    }

    function showDialog() {
        let dialog = new ButtonDialog();
        let contentDiv = dialog.Init(Loc('Share'), [
            {
                name: Loc('Close'),
                onClick() {
                    dialog.Close();
                }
            }
        ]);

        createMultiStepForm(contentDiv);

        const originalClose = dialog.Close.bind(dialog);
        dialog.Close = function() {
            SnapshotManager.cleanup();
            originalClose();
        };

        dialog.Open();
    }

    return {
        showDialog
    };
}
