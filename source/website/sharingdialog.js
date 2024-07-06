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

function createSnapshotManager(viewer, settings, snapshotWidth1 = 2000, snapshotHeight1 = 1080, snapshotWidth2 = 1080, snapshotHeight2 = 540) {
    const initialZoomLevel = settings.snapshotZoomLevel || 0.5;

    let isPanning1 = false, isPanning2 = false, isPanning3 = false;
    let isOrbiting1 = false, isOrbiting2 = false, isOrbiting3 = false;
    let startMousePosition1 = { x: 0, y: 0 }, startMousePosition2 = { x: 0, y: 0 }, startMousePosition3 = { x: 0, y: 0 };
    let previewImage1, previewImage2, previewImage3;
    let panOffset1 = { x: 0, y: 0 }, panOffset2 = { x: 0, y: 0 }, panOffset3 = { x: 0, y: 0 };
    let orbitOffset1 = { x: 0, y: 0 }, orbitOffset2 = { x: 0, y: 0 }, orbitOffset3 = { x: 0, y: 0 };
    let currentZoomLevel1 = initialZoomLevel, currentZoomLevel2 = initialZoomLevel, currentZoomLevel3 = initialZoomLevel;

    const camera1 = viewer.navigation.GetCamera();
    const camera2 = Object.assign({}, camera1);  // Clone the initial camera for the second preview
    const camera3 = Object.assign({}, camera1);  // Clone the initial camera for the third preview

    const originalRotate1 = camera1.eye.Rotate;
    const originalRotate2 = camera2.eye.Rotate;
    const originalRotate3 = camera3.eye.Rotate;

    function captureSnapshot(isTransparent, camera, zoomLevel, panOffset, orbitOffset, width, height) {
        // Adjust camera for better framing
        camera.zoom = zoomLevel;
        camera.panOffset = panOffset;
        camera.orbitOffset = orbitOffset;

        // Set the aspect ratio
        camera.aspectRatio = width / height;

        return CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel, panOffset, orbitOffset, camera);
    }

    function updatePreview1() {
        let imageUrl = captureSnapshot(false, camera1, currentZoomLevel1, panOffset1, orbitOffset1, snapshotWidth1, snapshotHeight1); // Default size for preview 1
        previewImage1.src = imageUrl;
    }

    function updatePreview2() {
        let imageUrl = captureSnapshot(false, camera2, currentZoomLevel2, panOffset2, orbitOffset2, snapshotWidth2, snapshotHeight2); // Half size for preview 2
        previewImage2.src = imageUrl;
    }

    function updatePreview3() {
        let imageUrl = captureSnapshot(false, camera3, currentZoomLevel3, panOffset3, orbitOffset3, snapshotWidth2, snapshotHeight2); // Half size for preview 3
        previewImage3.src = imageUrl;
    }

    function handlePreviewMouseMove1(event) {
        if (!isPanning1 && !isOrbiting1) return;

        const currentMousePosition = { x: event.clientX, y: event.clientY };
        const deltaX = currentMousePosition.x - startMousePosition1.x;
        const deltaY = currentMousePosition.y - startMousePosition1.y;

        if (isOrbiting1) {
            const orbitRatio = 0.1;
            orbitOffset1.x += deltaX * orbitRatio;
            orbitOffset1.y += deltaY * orbitRatio;
        } else if (isPanning1) {
            const panRatio = 0.075;
            panOffset1.x -= deltaX * panRatio;
            panOffset1.y -= deltaY * panRatio;
        }

        updatePreview1();

        startMousePosition1 = currentMousePosition;
        event.preventDefault();
    }

    function handlePreviewMouseMove2(event) {
        if (!isPanning2 && !isOrbiting2) return;

        const currentMousePosition = { x: event.clientX, y: event.clientY };
        const deltaX = currentMousePosition.x - startMousePosition2.x;
        const deltaY = currentMousePosition.y - startMousePosition2.y;

        if (isOrbiting2) {
            const orbitRatio = 0.1;
            orbitOffset2.x += deltaX * orbitRatio;
            orbitOffset2.y += deltaY * orbitRatio;
        } else if (isPanning2) {
            const panRatio = 0.075;
            panOffset2.x -= deltaX * panRatio;
            panOffset2.y -= deltaY * panRatio;
        }

        updatePreview2();

        startMousePosition2 = currentMousePosition;
        event.preventDefault();
    }

    function handlePreviewMouseMove3(event) {
        if (!isPanning3 && !isOrbiting3) return;

        const currentMousePosition = { x: event.clientX, y: event.clientY };
        const deltaX = currentMousePosition.x - startMousePosition3.x;
        const deltaY = currentMousePosition.y - startMousePosition3.y;

        if (isOrbiting3) {
            const orbitRatio = 0.1;
            orbitOffset3.x += deltaX * orbitRatio;
            orbitOffset3.y += deltaY * orbitRatio;
        } else if (isPanning3) {
            const panRatio = 0.075;
            panOffset3.x -= deltaX * panRatio;
            panOffset3.y -= deltaY * panRatio;
        }

        updatePreview3();

        startMousePosition3 = currentMousePosition;
        event.preventDefault();
    }

    function handlePreviewMouseUp1(event) {
        isPanning1 = false;
        isOrbiting1 = false;
        document.removeEventListener('mousemove', handlePreviewMouseMove1, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp1, true);
        event.preventDefault();
    }

    function handlePreviewMouseUp2(event) {
        isPanning2 = false;
        isOrbiting2 = false;
        document.removeEventListener('mousemove', handlePreviewMouseMove2, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp2, true);
        event.preventDefault();
    }

    function handlePreviewMouseUp3(event) {
        isPanning3 = false;
        isOrbiting3 = false;
        document.removeEventListener('mousemove', handlePreviewMouseMove3, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp3, true);
        event.preventDefault();
    }

    function handlePreviewMouseDown1(event) {
        startMousePosition1 = { x: event.clientX, y: event.clientY };
        if (event.button === 0) {
            isOrbiting1 = true;
        } else if (event.button === 1 || event.button === 2) {
            isPanning1 = true;
        }
        document.addEventListener('mousemove', handlePreviewMouseMove1, true);
        document.addEventListener('mouseup', handlePreviewMouseUp1, true);
        event.preventDefault();
    }

    function handlePreviewMouseDown2(event) {
        startMousePosition2 = { x: event.clientX, y: event.clientY };
        if (event.button === 0) {
            isOrbiting2 = true;
        } else if (event.button === 1 || event.button === 2) {
            isPanning2 = true;
        }
        document.addEventListener('mousemove', handlePreviewMouseMove2, true);
        document.addEventListener('mouseup', handlePreviewMouseUp2, true);
        event.preventDefault();
    }

    function handlePreviewMouseDown3(event) {
        startMousePosition3 = { x: event.clientX, y: event.clientY };
        if (event.button === 0) {
            isOrbiting3 = true;
        } else if (event.button === 1 || event.button === 2) {
            isPanning3 = true;
        }
        document.addEventListener('mousemove', handlePreviewMouseMove3, true);
        document.addEventListener('mouseup', handlePreviewMouseUp3, true);
        event.preventDefault();
    }

    function handleMouseWheel1(event) {
        const zoomSpeed = 0.001;
        currentZoomLevel1 += event.deltaY * zoomSpeed;
        currentZoomLevel1 = Math.min(Math.max(currentZoomLevel1, 0.1), 3);
        updatePreview1();
        event.preventDefault();
    }

    function handleMouseWheel2(event) {
        const zoomSpeed = 0.001;
        currentZoomLevel2 += event.deltaY * zoomSpeed;
        currentZoomLevel2 = Math.min(Math.max(currentZoomLevel2, 0.1), 3);
        updatePreview2();
        event.preventDefault();
    }

    function handleMouseWheel3(event) {
        const zoomSpeed = 0.001;
        currentZoomLevel3 += event.deltaY * zoomSpeed;
        currentZoomLevel3 = Math.min(Math.max(currentZoomLevel3, 0.1), 3);
        updatePreview3();
        event.preventDefault();
    }

    function initializePreviewImages(preview1Container, preview2Container, preview3Container) {
        previewImage1 = CreateDomElement('img', 'ov_snapshot_preview_image');
        previewImage2 = CreateDomElement('img', 'ov_snapshot_preview_image');
        previewImage3 = CreateDomElement('img', 'ov_snapshot_preview_image');
    
        preview1Container.appendChild(previewImage1);
        preview2Container.appendChild(previewImage2);
        preview3Container.appendChild(previewImage3);
    
        previewImage1.addEventListener('wheel', handleMouseWheel1, true);
        previewImage1.addEventListener('mousedown', handlePreviewMouseDown1, true);
    
        previewImage2.addEventListener('wheel', handleMouseWheel2, true);
        previewImage2.addEventListener('mousedown', handlePreviewMouseDown2, true);
    
        previewImage3.addEventListener('wheel', handleMouseWheel3, true);
        previewImage3.addEventListener('mousedown', handlePreviewMouseDown3, true);
    
        updatePreview1();
        updatePreview2();
        updatePreview3();
    }

    function cleanup() {
        previewImage1.removeEventListener('mousedown', handlePreviewMouseDown1, true);
        document.removeEventListener('mousemove', handlePreviewMouseMove1, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp1, true);
        previewImage1.removeEventListener('wheel', handleMouseWheel1, true);

        previewImage2.removeEventListener('mousedown', handlePreviewMouseDown2, true);
        document.removeEventListener('mousemove', handlePreviewMouseMove2, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp2, true);
        previewImage2.removeEventListener('wheel', handleMouseWheel2, true);

        previewImage3.removeEventListener('mousedown', handlePreviewMouseDown3, true);
        document.removeEventListener('mousemove', handlePreviewMouseMove3, true);
        document.removeEventListener('mouseup', handlePreviewMouseUp3, true);
        previewImage3.removeEventListener('wheel', handleMouseWheel3, true);

        camera1.eye.Rotate = originalRotate1;
        camera2.eye.Rotate = originalRotate2;
        camera3.eye.Rotate = originalRotate3;
    }

    return {
        initializePreviewImages,
        cleanup,
        captureSnapshot
    };
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

function createDialogManager(SnapshotManager) {
    function createMultiStepForm(parentDiv) {
        let formContainer = AddDiv(parentDiv, 'ov_dialog_form_container');
        let step1 = createStep1(formContainer);
        let step2 = createStep2(formContainer);

        return { step1, step2 };
    }

    function createStep1(container) {
        let step1 = AddDiv(container, 'ov_dialog_step ov_step1');
        
        let leftContainer = AddDiv(step1, 'ov_left_container');
        AddDiv(leftContainer, 'ov_dialog_title', Loc('Share Snapshot'));
        AddDiv(leftContainer, 'ov_dialog_description', Loc('Quickly share a snapshot and details of your pain location with family, friends, or therapists.'));
        
        let emailFieldsContainer = AddDiv(leftContainer, 'ov_email_fields_container');
        for (let i = 0; i < 3; i++) {
            let emailLabel = AddDiv(emailFieldsContainer, 'ov_dialog_label', Loc(`Email ${i + 1}`));
            let emailInput = AddDomElement(emailFieldsContainer, 'input', `email${i}`);
            emailInput.setAttribute('type', 'email');
            emailInput.setAttribute('class', 'ov_dialog_input');
            emailInput.setAttribute('placeholder', Loc('Enter email address'));
        }
        
        let rightContainer = AddDiv(step1, 'ov_right_container');
        let previewContainer = AddDiv(rightContainer, 'ov_preview_container');
        let preview1Container = AddDiv(previewContainer, 'ov_preview1_container');
        let previewRow = AddDiv(previewContainer, 'ov_preview_row'); // New row container for side-by-side previews
        let preview2Container = AddDiv(previewRow, 'ov_preview2_container');
        let preview3Container = AddDiv(previewRow, 'ov_preview3_container');
        
        SnapshotManager.initializePreviewImages(preview1Container, preview2Container, preview3Container);
        
        let nextButton = AddDiv(leftContainer, 'ov_button ov_next_button', Loc('Next'));
        nextButton.addEventListener('click', () => {
            step1.style.display = 'none';
            step2.style.display = 'block';
        });
        
        return step1;
    }

    function createStep2(container) {
        let step2 = AddDiv(container, 'ov_dialog_step ov_step2');
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

        let submitButton = AddDiv(step2, 'ov_button ov_submit_button', Loc('Submit'));
        submitButton.addEventListener('click', () => {
            let snapshot1 = SnapshotManager.captureSnapshot(false, camera1, currentZoomLevel1, panOffset1, orbitOffset1);
            let snapshot2 = SnapshotManager.captureSnapshot(false, camera2, currentZoomLevel2, panOffset2, orbitOffset2);
            let snapshot3 = SnapshotManager.captureSnapshot(false, camera3, currentZoomLevel3, panOffset3, orbitOffset3);

            let info = {
                intensity: intensityInput.value,
                duration: durationInput.value,
            };

            // Here you would imsplement the actual sharing logic
            // console.log('Sharing snapshot1:', snapshot1);
            // console.log('Sharing snapshot2:', snapshot2);
            // console.log('Sharing snapshot3:', snapshot3);
            // console.log('Sharing info:', info);

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