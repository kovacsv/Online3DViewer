import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';


const CONFIG = {
    SNAPSHOT_SIZES: {
        LARGE: { width: 2000, height: 1080 },
        SMALL: { width: 1080, height: 540 }
    },
    INITIAL_ZOOM: 0.5,
    MAX_ZOOM: 3,
    MIN_ZOOM: 0.1,
    ZOOM_SPEED: 0.001,
    ORBIT_RATIO: 0.1,
    PAN_RATIO: 0.075
};

export function ShowSharingDialog(settings, viewer) {
    const SnapshotManager = createSnapshotManager(viewer, settings);
    const DialogManager = createDialogManager(SnapshotManager);
    DialogManager.showDialog();
}

function createSnapshotManager(viewer, settings) {
    const cameras = Array(3).fill().map(() => ({ ...viewer.navigation.GetCamera() }));
    const states = Array(3).fill().map(() => ({
        isPanning: false,
        isOrbiting: false,
        startMousePosition: { x: 0, y: 0 },
        panOffset: { x: 0, y: 0 },
        orbitOffset: { x: 0, y: 0 },
        currentZoomLevel: CONFIG.INITIAL_ZOOM
    }));
    let previewImages = [];

    function captureSnapshot(index) {
        if (index < 0 || index >= cameras.length) {
            console.error(`Invalid index: ${index}`);
            return null;
        }

        const { width, height } = index === 0 ? CONFIG.SNAPSHOT_SIZES.LARGE : CONFIG.SNAPSHOT_SIZES.SMALL;
        const { currentZoomLevel, panOffset, orbitOffset } = states[index];
        const camera = cameras[index];

        camera.zoom = currentZoomLevel;
        camera.panOffset = panOffset;
        camera.orbitOffset = orbitOffset;
        camera.aspectRatio = width / height;

        return CaptureSnapshot(viewer, width, height, false, currentZoomLevel, panOffset, orbitOffset, camera);
    }

    function updatePreview(index) {
        if (index < 0 || index >= previewImages.length) {
            console.error(`Invalid preview index: ${index}`);
            return;
        }

        const snapshotData = captureSnapshot(index);
        if (snapshotData) {
            previewImages[index].src = snapshotData;
        } else {
            console.error(`Failed to capture snapshot for index: ${index}`);
        }
    }

    function initializePreviewImages(containers) {
        previewImages = containers.map((container, index) => {
            const img = CreateDomElement('img', 'ov_snapshot_preview_image');
            container.appendChild(img);
            ['wheel', 'mousedown'].forEach(eventType => 
                img.addEventListener(eventType, (e) => handleMouseEvent(index, eventType, e), true)
            );
            return img;
        });

        // Update previews after initialization
        previewImages.forEach((_, index) => updatePreview(index));
    }
    
    function handleMouseEvent(index, eventType, event) {
        const state = states[index];
        switch (eventType) {
            case 'mousemove':
                if (!state.isPanning && !state.isOrbiting) return;
                const currentMousePosition = { x: event.clientX, y: event.clientY };
                const deltaX = currentMousePosition.x - state.startMousePosition.x;
                const deltaY = currentMousePosition.y - state.startMousePosition.y;

                if (state.isOrbiting) {
                    state.orbitOffset.x += deltaX * CONFIG.ORBIT_RATIO;
                    state.orbitOffset.y += deltaY * CONFIG.ORBIT_RATIO;
                } else if (state.isPanning) {
                    state.panOffset.x -= deltaX * CONFIG.PAN_RATIO;
                    state.panOffset.y -= deltaY * CONFIG.PAN_RATIO;
                }

                updatePreview(index);
                state.startMousePosition = currentMousePosition;
                break;
            case 'mousedown':
                state.startMousePosition = { x: event.clientX, y: event.clientY };
                if (event.button === 0) {
                    state.isOrbiting = true;
                } else if (event.button === 1 || event.button === 2) {
                    state.isPanning = true;
                }
                document.addEventListener('mousemove', (e) => handleMouseEvent(index, 'mousemove', e), true);
                document.addEventListener('mouseup', (e) => handleMouseEvent(index, 'mouseup', e), true);
                break;
            case 'mouseup':
                state.isPanning = false;
                state.isOrbiting = false;
                document.removeEventListener('mousemove', (e) => handleMouseEvent(index, 'mousemove', e), true);
                document.removeEventListener('mouseup', (e) => handleMouseEvent(index, 'mouseup', e), true);
                break;
            case 'wheel':
                state.currentZoomLevel += event.deltaY * CONFIG.ZOOM_SPEED;
                state.currentZoomLevel = Math.min(Math.max(state.currentZoomLevel, CONFIG.MIN_ZOOM), CONFIG.MAX_ZOOM);
                updatePreview(index);
                break;
        }
        event.preventDefault();
    }

    function initializePreviewImages(containers) {
        previewImages = containers.map((container, index) => {
            const img = CreateDomElement('img', 'ov_snapshot_preview_image');
            container.appendChild(img);
            img.addEventListener('wheel', (e) => handleMouseEvent(index, 'wheel', e), { passive: false });
            img.addEventListener('mousedown', (e) => handleMouseEvent(index, 'mousedown', e));
            img.addEventListener('contextmenu', (e) => e.preventDefault());
            return img;
        });

        // Update previews after initialization
        previewImages.forEach((_, index) => updatePreview(index));
    }

    function cleanup() {
        previewImages.forEach((img, index) => {
            img.removeEventListener('wheel', (e) => handleMouseEvent(index, 'wheel', e));
            img.removeEventListener('mousedown', (e) => handleMouseEvent(index, 'mousedown', e));
        });
        document.removeEventListener('mousemove', handleMouseEvent);
        document.removeEventListener('mouseup', handleMouseEvent);
    }

    return { initializePreviewImages, cleanup, captureSnapshot, updatePreview };
}

function CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel, panOffset, orbitOffset, camera) {
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
        z: camera.center.z + normalizedRight.z * panOffset.x * panScale + camera.up.z * panScale
    };
    const pannedEye = {
        x: zoomedEye.x + normalizedRight.x * panOffset.x * panScale + camera.up.x * panOffset.y * panScale,
        y: zoomedEye.y + normalizedRight.y * panOffset.x * panScale + camera.up.y * panScale,
        z: zoomedEye.z + normalizedRight.z * panOffset.x * panScale + camera.up.z * panScale
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

    // Set aspect ratio and resize renderer
    viewer.renderer.setSize(width, height);
    viewer.camera.aspect = width / height;
    viewer.camera.updateProjectionMatrix();

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

function createDialogManager(snapshotManager) {
    function createMultiStepForm(parentDiv) {
        const formContainer = AddDiv(parentDiv, 'ov_dialog_form_container');
        const step1 = createStep(formContainer, 1);
        const step2 = createStep(formContainer, 2);
        return { step1, step2 };
    }

    function createStep(container, stepNumber) {
        const step = AddDiv(container, `ov_dialog_step ov_step${stepNumber}`);
        if (stepNumber === 2) step.style.display = 'none';

        const content = stepNumber === 1 ? createStep1Content(step) : createStep2Content(step);

        return step;
    }

    function createStep1Content(step) {
        const leftContainer = AddDiv(step, 'ov_left_container');
        AddDiv(leftContainer, 'ov_dialog_title', Loc('Share Snapshot'));
        AddDiv(leftContainer, 'ov_dialog_description', Loc('Quickly share a snapshot and details of your pain location with family, friends, or therapists.'));

        const emailFieldsContainer = AddDiv(leftContainer, 'ov_email_fields_container');
        for (let i = 0; i < 3; i++) {
            AddDiv(emailFieldsContainer, 'ov_dialog_label', Loc(`Email ${i + 1}`));
            const emailInput = AddDomElement(emailFieldsContainer, 'input', `email${i}`);
            emailInput.type = 'email';
            emailInput.className = 'ov_dialog_input';
            emailInput.placeholder = Loc('Enter email address');
        }

        const rightContainer = AddDiv(step, 'ov_right_container');
        const previewContainer = AddDiv(rightContainer, 'ov_preview_container');
        
        const preview1Container = AddDiv(previewContainer, 'ov_preview1_container');
        const previewRow = AddDiv(previewContainer, 'ov_preview_row');
        const preview2Container = AddDiv(previewRow, 'ov_preview2_container');
        const preview3Container = AddDiv(previewRow, 'ov_preview3_container');
    
        const previewContainers = [preview1Container, preview2Container, preview3Container];
    
        snapshotManager.initializePreviewImages(previewContainers);

        const nextButton = AddDiv(leftContainer, 'ov_button ov_next_button', Loc('Next'));
        nextButton.addEventListener('click', () => {
            step.style.display = 'none';
            step.nextElementSibling.style.display = 'block';
        });
    }

    function createStep2Content(step) {
        AddDiv(step, 'ov_dialog_title', Loc('Additional Options'));

        AddCheckbox(step, 'send_to_self', Loc('Send to myself'), false, () => {});
        AddCheckbox(step, 'download_snapshot', Loc('Download snapshot and info'), false, () => {});

        const intensityInput = createInputField(step, 'number', Loc('Pain Intensity'), 'Enter pain intensity (1-10)', { min: 1, max: 10 });
        const durationInput = createInputField(step, 'text', Loc('Pain Duration'), 'Enter pain duration (e.g., 2 hours, 3 days)');

        const submitButton = AddDiv(step, 'ov_button ov_submit_button', Loc('Submit'));
        submitButton.addEventListener('click', () => handleSubmit(intensityInput, durationInput));
    }

    function createInputField(container, type, labelText, placeholder, attributes = {}) {
        AddDiv(container, 'ov_dialog_label', labelText);
        const input = AddDomElement(container, 'input', null);
        input.type = type;
        input.className = 'ov_dialog_input';
        input.placeholder = Loc(placeholder);
        Object.entries(attributes).forEach(([key, value]) => input.setAttribute(key, value));
        return input;
    }

    function handleSubmit(intensityInput, durationInput) {
        const snapshots = [1, 2, 3].map(i => snapshotManager.captureSnapshot(i - 1));
        const info = {
            intensity: intensityInput.value,
            duration: durationInput.value,
        };

        // Here you would implement the actual sharing logic
        console.log('Sharing snapshots:', snapshots);
        console.log('Sharing info:', info);

        ShowMessageDialog(Loc('Success'), Loc('Your snapshot and information have been shared.'));
    }

    function showDialog() {
        const dialog = new ButtonDialog();
        const contentDiv = dialog.Init(Loc('Share'), [
            {
                name: Loc('Close'),
                onClick: () => dialog.Close()
            }
        ]);

        createMultiStepForm(contentDiv);

        const originalClose = dialog.Close.bind(dialog);
        dialog.Close = () => {
            snapshotManager.cleanup();
            originalClose();
        };

        dialog.Open();
    }

    return { showDialog };
}