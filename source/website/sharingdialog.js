import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { Loc } from '../engine/core/localization.js';
import { Camera } from '../engine/viewer/camera.js';
import { GetDefaultCamera } from '../engine/viewer/viewer.js';
import { Direction } from '../engine/geometry/geometry.js';
import { generatePdf } from './pdfGenerator.js';
import { MouseInteraction, TouchInteraction } from '../engine/viewer/navigation.js';
import * as THREE from 'three';
import { CoordDistance3D } from '../engine/geometry/coord3d.js';
import { TrackUmamiEvent } from './umami.js';

export function ShowSharingDialog(settings, viewer) {
    TrackUmamiEvent('Sharing Dialog Opened');
    const SnapshotManager = createPreviewManager(viewer, settings);
    const DialogManager = createDialogManager(SnapshotManager);
    DialogManager.showDialog();
}

function isMobileScreen() {
    return window.matchMedia('(max-width: 428px)').matches;
}

const CONFIG = {
    SNAPSHOT_SIZES: isMobileScreen() ? {
        LARGE: { width: 331, height: 304 },
        SMALL: { width: 164, height: 250 }
    } : { // desktop view
        LARGE: { width: 463, height: 500 },
        SMALL: { width: 300, height: 286 }
    },

    INITIAL_ZOOM: isMobileScreen() ? 2 : 1,
    MAX_ZOOM: 3,
    MIN_ZOOM: 0.1,
    ZOOM_SPEED: 0.001,
    ORBIT_RATIO: 0.3,
    PAN_RATIO: 0.075
};

function createPreviewManager(viewer, settings) {
    const currentCamera = viewer.navigation.GetCamera();
    const cameras = Array(3).fill().map(() => {
        let defaultCamera = GetDefaultCamera(Direction.Y);
        let newCamera = new Camera(
            currentCamera.eye.Clone(),
            currentCamera.center.Clone(),
            defaultCamera.up.Clone(),
            currentCamera.fov
        );

        viewer.navigation.MoveCamera(newCamera, 0);
        viewer.navigation.Zoom(Math.log(CONFIG.INITIAL_ZOOM));
        return newCamera;
    });
    const states = Array(3).fill().map(() => ({
        isPanning: false,
        isOrbiting: false,
        startMousePosition: { x: 0, y: 0 },
        panOffset: isMobileScreen() ? { x: 0, y: 0 } : { x: 0, y: 0 },
        orbitOffset: { x: 0, y: 0 },
        currentZoomLevel: CONFIG.INITIAL_ZOOM,
    }));
    let previewImages = [];
    let touchInteractions = [];
    let mouseInteractions = [];
    let renderers = [];

    function CaptureSnapshot(viewer, width, height, isTransparent, zoomLevel, panOffset, orbitOffset, camera) {
        // Calculate new camera position based on zoom level
        const direction = {
            x: camera.eye.x - camera.center.x,
            y: camera.eye.y - camera.center.y,
            z: camera.eye.z - camera.center.z
        };
        const distance = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
        const newDistance = distance / zoomLevel / 1.2 ;

        const normalizedDirection = {
            x: direction.x / distance,
            y: direction.y / distance,
            z: direction.z / distance
        };

        // Apply the zoomed position
        camera.eye.x = camera.center.x + normalizedDirection.x * newDistance;
        camera.eye.y = camera.center.y + normalizedDirection.y * newDistance;
        camera.eye.z = camera.center.z + normalizedDirection.z * newDistance;

        // Apply pan based on the original calculations
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

        camera.center.x += normalizedRight.x * panOffset.x + camera.up.x * panOffset.y;
        camera.center.y += normalizedRight.y * panOffset.x + camera.up.y * panOffset.y;
        camera.center.z += normalizedRight.z * panOffset.x + camera.up.z * panOffset.y;

        // Move and update the camera
        viewer.navigation.MoveCamera(camera, 0);

        // Apply orbit adjustments
        viewer.navigation.Orbit(orbitOffset.x, orbitOffset.y);

        // Update renderer aspect ratio and dimensions
        viewer.renderer.setSize(width, height);
        viewer.camera.aspect = width / height;
        viewer.camera.updateProjectionMatrix();

        // Capture the image
        const imageDataUrl = viewer.GetImageAsDataUrl(width, height, isTransparent);

        return imageDataUrl;
    }

    function updateCanvas(index) {
        const { width, height } = index === 0 ? CONFIG.SNAPSHOT_SIZES.LARGE : CONFIG.SNAPSHOT_SIZES.SMALL;
        const camera = cameras[index];
        const renderer = renderers[index];
        const { panOffset, orbitOffset, currentZoomLevel } = states[index];

        // log the states
        console.log('Camera:', camera, 'Pan Offset:', panOffset, 'Orbit Offset:', orbitOffset, 'Current Zoom Level:', currentZoomLevel);

        viewer.navigation.MoveCamera(camera, 0);
        // Set aspect ratio and resize renderer
        viewer.renderer.setSize(width, height);
        viewer.camera.aspect = width / height;
        viewer.camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        // Explicitly set the size of the canvas element
        renderer.domElement.style.width = width + 'px';
        renderer.domElement.style.height = height + 'px';

        // Then set the renderer's internal size
        renderer.setSize(width, height, false); // 'false' ensures it doesn't change the canvas style
        renderer.render(viewer.scene, viewer.camera);
    }


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

    function initializePreviewImages(containers) {

        function rotateCamera(camera, degrees) {
            const radians = degrees * (Math.PI / 180);
            const distance = Math.sqrt(camera.eye.x ** 2 + camera.eye.z ** 2);
            camera.eye.x = distance * Math.cos(radians);
            camera.eye.z = distance * Math.sin(radians);
        }

        previewImages = containers.map((container, index) => {
            const img = CreateDomElement('canvas', 'ov_snapshot_preview_image');
            container.appendChild(img);

            // Set initial size
            const { width, height } = index === 0 ? CONFIG.SNAPSHOT_SIZES.LARGE : CONFIG.SNAPSHOT_SIZES.SMALL;
            img.width = width;
            img.height = height;

            const mouseInteraction = new MouseInteraction();
            mouseInteractions[index] = mouseInteraction;


            // Touch events
            const touchInteraction = new TouchInteraction();
            touchInteractions[index] = touchInteraction;

            const renderer = new THREE.WebGLRenderer({ canvas: img, alpha: true });
            renderers.push(renderer);

            // Rotate cameras 2 and 3 specifically ( Don't know why this works better? instead of 120, 240)
            if (index === 1) {
                rotateCamera(cameras[index], 240);
            } else if (index === 2) {
                rotateCamera(cameras[index], 380);
            }
            img.addEventListener('contextmenu', (e) => { e.preventDefault(); }, { passive: false });
            img.addEventListener('mousedown', (e) => handleMouseDown(index, e), { passive: false });
            img.addEventListener('mousemove', (e) => handleMouseMove(index, e), { passive: false });
            img.addEventListener('mouseup', (e) => handleMouseUp(index, e), { passive: false });
            img.addEventListener('wheel', (e) => handleWheelEvent(index, e), { passive: false });

            img.addEventListener('touchstart', (e) => handleTouchStart(index, e), { passive: false });
            img.addEventListener('touchmove', throttle((e) => handleTouchMove(index, e), 100), { passive: false });
            img.addEventListener('touchend', (e) => handleTouchEnd(index, e), { passive: false });

            return img;
        });

        // Update previews after initialization
        previewImages.forEach((_, index) => updateCanvas(index));
    }


    function handleTouchStart(index, event) {
        event.preventDefault();
        touchInteractions[index].Start(previewImages[index], event);
        const state = states[index];
        state.startMousePosition = touchInteractions[index].GetPosition();
        state.isOrbiting = true;
    }

    function throttle(callback, limit) {
        let waiting = false; // Initially, we're not waiting
        return function (...args) { // We return a throttled function
            if (!waiting) { // If we're not waiting
                callback.apply(this, args); // Execute users callback
                waiting = true; // Prevent future invocations
                setTimeout(() => { // After a period of time
                    waiting = false; // And allow future invocations
                }, limit);
            }
        };
    }

    function handleTouchMove(index, event) {
        event.preventDefault();
        touchInteractions[index].Move(previewImages[index], event);

        const state = states[index];
        const moveDiff = touchInteractions[index].GetMoveDiff();
        const distanceDiff = touchInteractions[index].GetDistanceDiff();

        let camera = cameras[index];
        let eyeCenterDistance = CoordDistance3D (camera.eye, camera.center);
        let panRatio = 0.001 * eyeCenterDistance;

        if (touchInteractions[index].GetFingerCount() === 1) {
            // Continue using the Orbit functionality
            viewer.navigation.Orbit(moveDiff.x * CONFIG.ORBIT_RATIO, moveDiff.y * CONFIG.ORBIT_RATIO);
        } else if (touchInteractions[index].GetFingerCount() === 2) {
            // Use the EmbeddedViewer's navigation pan and zoom
            viewer.navigation.Pan(moveDiff.x * panRatio, moveDiff.y * panRatio);
            viewer.navigation.Zoom(distanceDiff * CONFIG.ZOOM_SPEED);

            // Adjust current zoom level in the state for consistency
            state.currentZoomLevel *= (1 - distanceDiff * 0.01);
            state.currentZoomLevel = Math.min(Math.max(state.currentZoomLevel, CONFIG.MIN_ZOOM), CONFIG.MAX_ZOOM);
        }

        updateCanvas(index);
    }

    function handleTouchEnd(index, event) {
        event.preventDefault();
        touchInteractions[index].End(previewImages[index], event);
        const state = states[index];
        state.isOrbiting = false;
    }

    function handleWheelEvent(index, event) {
        event.preventDefault();
        const zoomDelta = -1 * event.deltaY * CONFIG.ZOOM_SPEED;
        viewer.navigation.Zoom(zoomDelta);
        updateCanvas(index);
    }

    function handleMouseDown(index, event) {
        event.preventDefault();
        const state = states[index];
        state.startMousePosition = { x: event.clientX, y: event.clientY };

        // Determine whether it's an orbit or pan based on the mouse button
        if (event.button === 0) { // Left mouse button for orbit
            state.isOrbiting = true;
        } else if (event.button === 2) { // Right mouse button for pan
            state.isPanning = true;
        }
    }

    function handleMouseMove(index, event) {
        event.preventDefault();
        const state = states[index];
        if (!state.isOrbiting && !state.isPanning) return; // Do nothing if no action has been started

        const currentMousePosition = { x: event.clientX, y: event.clientY };
        const deltaX = currentMousePosition.x - state.startMousePosition.x;
        const deltaY = currentMousePosition.y - state.startMousePosition.y;

        let camera = cameras[index];
        let eyeCenterDistance = CoordDistance3D (camera.eye, camera.center);
        let panRatio = 0.001 * eyeCenterDistance;

        if (state.isOrbiting) {
            viewer.navigation.Orbit(deltaX * CONFIG.ORBIT_RATIO, deltaY * CONFIG.ORBIT_RATIO);
        } else if (state.isPanning) {
            viewer.navigation.Pan(deltaX * panRatio, deltaY * panRatio);
        }

        // Update the canvas to reflect changes
        updateCanvas(index);
        state.startMousePosition = currentMousePosition; // Update the starting mouse position for the next move
    }

    function handleMouseUp(index, event) {
        event.preventDefault();
        const state = states[index];
        state.isOrbiting = false;
        state.isPanning = false;
    }

    function cleanup() {
        previewImages.forEach((img, index) => {
            // Remove mouse interaction event listeners
            img.removeEventListener('mousedown', (e) => handleMouseDown(index, e));
            img.removeEventListener('mousemove', (e) => handleMouseMove(index, e));
            img.removeEventListener('mouseup', (e) => handleMouseUp(index, e));
            img.removeEventListener('wheel', (e) => handleWheelEvent(index, e));

            // Remove touch interaction event listeners
            img.removeEventListener('touchstart', (e) => handleTouchStart(index, e));
            img.removeEventListener('touchmove', (e) => handleTouchMove(index, e));
            img.removeEventListener('touchend', (e) => handleTouchEnd(index, e));
        });

        // If there's a global event listener attached to the document for mouse moves or mouse up,
        // consider their removal here if they were added elsewhere
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    return { cleanup, captureSnapshot, initializePreviewImages, updateCanvas };
}

function createDialogManager(snapshotManager) {

    function addCloseButton(dialog, dialogElement) {
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;'; // This creates an "×" symbol
        closeButton.className = 'ov_dialog_close_button';
        closeButton.addEventListener('click', () => {
            dialog.Close();
            removeOverlayIfExists(overlay);
        });
        dialogElement.appendChild(closeButton);
    }

    function createPatientInfoSubHeader(container) {
        const subHeader = AddDomElement(container, 'h3', 'ov_form_sub_header');
        subHeader.textContent = 'Enter patient details below: ';
        return subHeader;
    }

    function createMultiStepForm(parentDiv) {
        const formContainer = AddDiv(parentDiv, 'ov_dialog_form_container');
        const shareHeader = AddDiv(formContainer, 'ov_share_header');
        shareHeader.textContent = 'Share';

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

    function createLabeledInput(container, type, labelText, placeholder, attributes = {}) {
        const wrapper = AddDiv(container, 'ov_input_wrapper');
        const label = AddDomElement(wrapper, 'label', 'ov_dialog_label');
        label.textContent = labelText;
        let input;
        if (type === 'textarea') {
            input = AddDomElement(wrapper, 'textarea', 'ov_dialog_input');
        } else {
            input = AddDomElement(wrapper, 'input', 'ov_dialog_input');
            input.type = type;
        }
        input.placeholder = placeholder;
        Object.entries(attributes).forEach(([key, value]) => input.setAttribute(key, value));
        return input;
    }

    // function validateEmails() {
    //     const emails = [patientEmailInput.value.trim(), ...emailInputs.map(input => input.value.trim())];
    //     const uniqueEmails = new Set(emails.filter(email => email !== ''));

    //     if (uniqueEmails.size !== emails.filter(email => email !== '').length) {
    //         alert(Loc('Please ensure all email addresses are unique.'));
    //         return false;
    //     }

    //     let oneEmailFilled = false;
    //     for (const email of emails) {
    //         if (email !== '') {
    //             oneEmailFilled = true;
    //             break;
    //         }
    //     }

    //     if (!oneEmailFilled) {
    //         alert(Loc('Please enter at least one email address.'));
    //         return false;
    //     }

    //     return true;
    // }

    function createStep1Content(step) {
        const container = AddDiv(step, 'ov_content_container');

        const headerSection = createHeaderSection(container);
        const contentWrapper = AddDiv(container, 'ov_content_wrapper');
        const previewSection = createPreviewSection(contentWrapper);
        const formSection = createFormSection(contentWrapper);

        return { ...headerSection, ...formSection, ...previewSection };
    }

    function createHeaderSection(container) {
        const header = AddDiv(container, 'ov_header_section');
        AddDiv(header, 'ov_dialog_description', Loc('Quickly share a snapshot and details of where it hurts with family, friends, or therapists.'));
        return {};
    }

    function createPreviewSection (container) {
        const previewContainer = AddDiv(container, 'ov_preview_container');
        const preview1Container = AddDiv(previewContainer, 'ov_preview1_container');
        const previewRow = AddDiv(previewContainer, 'ov_preview_row');
        const preview2Container = AddDiv(previewRow, 'ov_preview2_container');
        const preview3Container = AddDiv(previewRow, 'ov_preview3_container');

        const previewContainers = [preview1Container, preview2Container, preview3Container];
        snapshotManager.initializePreviewImages(previewContainers);

        return { previewContainers };
    }

    function createFormSection(container) {
        const formContainer = AddDiv(container, 'ov_form_section');
        createPatientInfoSubHeader(formContainer);

        const infoFieldsContainer = AddDiv(formContainer, 'ov_info_fields_container');
        const patientNameInput = createLabeledInput(infoFieldsContainer, 'text', Loc('Name'), 'John Doe');
        const intensityInput = createLabeledInput(infoFieldsContainer, 'number', Loc('Pain Intensity'), 'Enter pain intensity (1 lowest ~ 10 highest)', { min: 1, max: 10 });
        const durationInput = createLabeledInput(infoFieldsContainer, 'text', Loc('Pain Duration'), 'Enter pain duration (e.g., 2 hours, 3 days)');
        const descriptionInput = createLabeledInput(infoFieldsContainer, 'textarea', Loc('Description'), 'Dull, Aching, Pressure, Heavy, Throbbing, etc...');
        const ageInput = createLabeledInput(infoFieldsContainer, 'number', Loc('Age'), 'Enter age (optional)', { min: 0, max: 120 });

        // Create Download Report button (main action)
        const downloadButton = AddDomElement(formContainer, 'button', 'ov_button ov_download_button');
        downloadButton.textContent = Loc('Download Report');
        downloadButton.addEventListener('click', () => {
            handleGenerateSelfReportPdf(patientNameInput, intensityInput, durationInput, descriptionInput, patientEmailInput, ageInput);
        });

        // Add label between Download Report button and email portion
        const labelBetweenSections = AddDiv(formContainer, 'ov_label_between_sections');
        labelBetweenSections.textContent = Loc('----- or -----');
        labelBetweenSections.style.textAlign = 'center';

        AddDiv(formContainer, 'ov_get_patient_email_intro', Loc('COMING SOON'));
        AddDiv(formContainer, 'ov_get_patient_email_intro', Loc('We can send the report to your email'));
        const patientEmailInput = createLabeledInput(formContainer, 'email', 'Your Email', 'Enter your email', { required: true });

        AddDiv(formContainer, 'ov_get_send_emails_intro', Loc('You can also share this report with up to 3 other emails.'));
        const emailFieldsContainer = AddDiv(formContainer, 'ov_email_fields_container');
        const emailInputs = [];
        for (let i = 0; i < 3; i++) {
            const emailInput = createLabeledInput(emailFieldsContainer, 'email', `Email ${i + 1}`, `Enter email ${i + 1}`);
            emailInputs.push(emailInput);
        }

        // Create Submit button (sub action)
        const submitButton = AddDomElement(formContainer, 'button', 'ov_button ov_submit_button');
        submitButton.textContent = Loc('Submit');
        submitButton.addEventListener('click', () => {
            // Handle submit action
            console.log('Email Sending not implemented yet')
            TrackUmamiEvent('Sending Email Report');
        });

        return { nameInput: patientNameInput, intensityInput, durationInput, descriptionInput, emailInputs, patientEmailInput };
    }

    function createStep2Content(step) {
        AddDiv(step, 'ov_dialog_title', Loc('Additional Options'));

        AddCheckbox(step, 'send_to_self', Loc('Send to myself'), false, () => {});
        AddCheckbox(step, 'download_snapshot', Loc('Download snapshot and info'), false, () => {});

        const submitButton = AddDiv(step, 'ov_button ov_submit_button', Loc('Send Report'));
        submitButton.addEventListener('click', () => handleSubmit());
    }

    function handleGenerateSelfReportPdf (nameInput, intensityInput, durationInput, descriptionInput, emailFieldsContainer, ageInput) {
        console.log('Generating PDF...');
        console.log('Params:', nameInput, intensityInput.value, durationInput.value, descriptionInput.value);
        const snapshots = [1, 2, 3].map(i => snapshotManager.captureSnapshot(i - 1));
        const description = descriptionInput ? descriptionInput.value : '';

        const emails = [];
        for (let i = 0; i < emailFieldsContainer.children.length; i++) {
            const emailInput = emailFieldsContainer.children[i];
            if (emailInput.value) {
                emails.push(emailInput.value);
            }
        }

        const data = {
            patientName: nameInput.value || 'John Doe', // Use 'John Doe' if the field is empty
            email: emails.join(', ') || 'john_doe@gmail.com',
            age: ageInput.value || 'private', // Example static age, you might want to collect this from user
            gender: 'Other', // Example static gender, you might want to collect this from user
            typeOfPain: description, // Using description as 'typeOfPain'
            painDuration: durationInput.value || 'private', // Example static pain duration, you might want to collect this from user
            date: new Date().toISOString().slice(0, 10), // Current date in YYYY-MM-DD format
            images: snapshots,
            siteUrl: window.location.origin
        };
        let isForPatient = true;
        generatePdf(data, isForPatient);
    }

    function handleSubmit() {
        console.log('Submitting...');
        // Implement submission logic
        ShowMessageDialog(Loc('Success'), Loc('Your snapshot and information have been shared.'));
    }

    function showDialog() {
        const overlay = createModalOverlay();
        document.body.appendChild(overlay);

        const dialog = new ButtonDialog();
        const contentDiv = dialog.Init(Loc(''), [
            {
                name: Loc(''),
                onClick() {
                    dialog.Close();
                    removeOverlayIfExists(overlay);
                }
            }
        ]);
        if (isMobileScreen()) {
            contentDiv.style.marginRight = '35px';
            contentDiv.style.alignItems = 'center';
            contentDiv.style.left = '50%';
            contentDiv.style.top = '50%';
            contentDiv.style.transform = 'translate(-50%, -50%)';
            contentDiv.style.zIndex = '9999';
            contentDiv.style.width = '90%';
            contentDiv.style.height = '90%';
            contentDiv.style.maxWidth = '800px';
            contentDiv.style.maxHeight = '90%';
            contentDiv.style.borderRadius = '8px';
            contentDiv.style.position = 'fixed';
            contentDiv.style.backgroundColor = '#fff';
            contentDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            contentDiv.style.padding = '0px';
            contentDiv.style.overflow = 'auto';
            contentDiv.style.border = '1px solid #ccc';
            contentDiv.style.boxSizing = 'border-box';
        }

        const { step1, step2 } = createMultiStepForm(contentDiv);
        const originalClose = dialog.Close.bind(dialog);
        dialog.Close = function() {
            snapshotManager.cleanup();
            removeOverlayIfExists(overlay);
            originalClose();
            let event = new Event('resize');
            window.dispatchEvent(event);

        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                dialog.Close();
            }
        });

        dialog.Open();

        setTimeout(() => {
            styleDialogForSharing(dialog);
            addCloseButton(dialog, contentDiv);
        }, 0);
    }

    function createModalOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998; // Ensure this is below the dialog but above everything else
        `;
        return overlay;
    }

    function styleDialogForSharing(dialog) {
        if (!dialog) {
            console.error('Invalid dialog object');
            return;
        }

        // Try to find the dialog element
        let dialogElement = null;
        if (dialog.GetContentDiv) {
            dialogElement = dialog.GetContentDiv().closest('.ov_dialog');
        }
        if (!dialogElement && dialog.dialogDiv) {
            dialogElement = dialog.dialogDiv;
        }
        if (!dialogElement) {
            console.error('Cannot find dialog element');
            return;
        }

        dialogElement.style.zIndex = '9999';
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            dialogElement.style.width = '100%';
            dialogElement.style.height = '100%';
            dialogElement.style.maxWidth = '100%';
            dialogElement.style.maxHeight = '100%';
            dialogElement.style.top = '0';
            dialogElement.style.left = '0';
            dialogElement.style.transform = 'none';
            dialogElement.style.borderRadius = '0';
            dialogElement.style.position = 'fixed';
        } else {
            dialogElement.style.width = '90%';
            dialogElement.style.maxWidth = '900px';
            dialogElement.style.maxHeight = '90vh';
            dialogElement.style.top = '50%';
            dialogElement.style.left = '50%';
            dialogElement.style.transform = 'translate(-50%, -50%)';
            dialogElement.style.borderRadius = '8px';
            dialogElement.style.position = 'fixed';
        }
        dialogElement.style.overflow = 'auto';
    }

    function removeOverlayIfExists(overlay) {
        if (overlay && overlay.parentNode === document.body) {
            document.body.removeChild(overlay);
        }
    }

    return { showDialog };
}
