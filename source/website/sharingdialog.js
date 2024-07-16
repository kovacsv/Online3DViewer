import { AddDiv, AddDomElement, CreateDomElement } from '../engine/viewer/domutils.js';
import { AddCheckbox } from '../website/utils.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog } from './dialog.js';
import { HandleEvent } from './eventhandler.js';
import { Loc } from '../engine/core/localization.js';
import { generatePdf } from './pdfGenerator.js';

const CONFIG = {
    SNAPSHOT_SIZES: {
        LARGE: { width: 2000, height: 2160 },
        SMALL: { width: 1080, height: 1080 }
    },
    INITIAL_ZOOM: 0.5,
    MAX_ZOOM: 3,
    MIN_ZOOM: 0.1,
    ZOOM_SPEED: 0.001,
    ORBIT_RATIO: 0.1,
    PAN_RATIO: 0.075
};

export function ShowSharingDialog(settings, viewer) {
    console.log("ShowSharingDialog called with settings:", settings);
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
        console.log(`Capturing snapshot for index: ${index}`);
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
            ['wheel', 'mousedown', 'mousemove', 'mouseup', 'contextmenu'].forEach(eventType => {
                img.addEventListener(eventType, (e) => {
                    e.stopPropagation();
                    handleMouseEvent(index, eventType, e);
                }, { passive: false });
            });
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

    function validateEmails() {
        const emails = [patientEmailInput.value.trim(), ...emailInputs.map(input => input.value.trim())];
        const uniqueEmails = new Set(emails.filter(email => email !== ''));

        if (uniqueEmails.size !== emails.filter(email => email !== '').length) {
            alert(Loc('Please ensure all email addresses are unique.'));
            return false;
        }

        let oneEmailFilled = false;
        for (const email of emails) {
            if (email !== '') {
                oneEmailFilled = true;
                break;
            }
        }

        if (!oneEmailFilled) {
            alert(Loc('Please enter at least one email address.'));
            return false;
        }

        return true;
    }

    function createStep1Content(step) {
        const leftContainer = AddDiv(step, 'ov_left_container');
        AddDiv(leftContainer, 'ov_dialog_title', Loc('Share Snapshot'));
        AddDiv(leftContainer, 'ov_dialog_description', Loc('Quickly share a snapshot and details of where it hurts with family, friends, or therapists. \n Help '));

        // Info fields container
        const infoFieldsContainer = AddDiv(leftContainer, 'ov_info_fields_container');

        // Name input field
        const nameInput = createLabeledInput(infoFieldsContainer, 'text', Loc('Name'), 'John Doe');

        const intensityInput = createLabeledInput(infoFieldsContainer, 'number', Loc('Pain Intensity'), 'Enter pain intensity (1-10)', { min: 1, max: 10 });
        const durationInput = createLabeledInput(infoFieldsContainer, 'text', Loc('Pain Duration'), 'Enter pain duration (e.g., 2 hours, 3 days)');

        // Description and Tags input fields (optional)
        const descriptionInput = createLabeledInput(infoFieldsContainer, 'textarea', Loc('Description'), 'Description (optional)');

        // Email fields container
        AddDiv(leftContainer, 'ov_get_send_emails_intro', Loc('You can send this snapshot to up to 3 email addresses.'));
        const emailFieldsContainer = AddDiv(leftContainer, 'ov_email_fields_container');
        const emailInputs = [];
        for (let i = 0; i < 3; i++) {
            const emailInput = AddDomElement(emailFieldsContainer, 'input', `email${i}`);
            emailInput.type = 'email';
            emailInput.className = 'ov_dialog_input';
            emailInput.placeholder = Loc(`Enter email ${i + 1}`);
            emailInput.id = `email${i}`; // Add an id for easy reference
            emailInputs.push(emailInput);
        }

        AddDiv(leftContainer, 'ov_get_patient_email_intro', Loc('Share your email with us so we can CC you in the report.'));
        const patientEmailInput = AddDomElement(leftContainer, 'input', 'exclusive_email');
        patientEmailInput.type = 'email';
        patientEmailInput.className = 'ov_dialog_input';
        patientEmailInput.placeholder = Loc('Enter your email');
        patientEmailInput.required = true;


        const rightContainer = AddDiv(step, 'ov_right_container');
        const previewContainer = AddDiv(rightContainer, 'ov_preview_container');

        const preview1Container = AddDiv(previewContainer, 'ov_preview1_container');
        const previewRow = AddDiv(previewContainer, 'ov_preview_row');
        const preview2Container = AddDiv(previewRow, 'ov_preview2_container');
        const preview3Container = AddDiv(previewRow, 'ov_preview3_container');

        const previewContainers = [preview1Container, preview2Container, preview3Container];
        snapshotManager.initializePreviewImages(previewContainers);

        // Add the download icon
        const downloadIcon = document.createElement('div');
        downloadIcon.classList.add('download-icon');
        downloadIcon.innerHTML = `<i class="icon icon-download"></i>`; // Use icon font class here
        leftContainer.appendChild(downloadIcon);
        downloadIcon.addEventListener('click', () => handleGeneratePdf(nameInput, intensityInput, durationInput, descriptionInput, emailFieldsContainer));

        const nextButton = AddDomElement(leftContainer, 'button', 'ov_button ov_next_button');
        nextButton.textContent = Loc('Next');
        nextButton.addEventListener('click', () => {
            step.style.display = 'none';
            step.nextElementSibling.style.display = 'block';
        });

        return { nameInput, intensityInput, durationInput, descriptionInput, emailFieldsContainer };
    }

    function createStep2Content(step) {
        AddDiv(step, 'ov_dialog_title', Loc('Additional Options'));

        AddCheckbox(step, 'send_to_self', Loc('Send to myself'), false, () => {});
        AddCheckbox(step, 'download_snapshot', Loc('Download snapshot and info'), false, () => {});

        const submitButton = AddDiv(step, 'ov_button ov_submit_button', Loc('Submit'));
        submitButton.addEventListener('click', () => handleSubmit());
    }

    function handleGeneratePdf(nameInput, intensityInput, durationInput, descriptionInput, emailFieldsContainer) {
        console.log('Generating PDF...');
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
            name: nameInput.value || 'John Doe', // Use 'John Doe' if the field is empty
            email: emails.join(', ') || 'john_doe@gmail.com',
            description: description,
            intensity: intensityInput.value,
            duration: durationInput.value,
            images: snapshots,
            siteUrl: window.location.origin
        };

        generatePdf(data);
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
        const contentDiv = dialog.Init(Loc('Share'), [
            {
                name: Loc('Close'),
                onClick() {
                    dialog.Close();
                    removeOverlayIfExists(overlay);
                }
            }
        ]);

        const { step1, step2 } = createMultiStepForm(contentDiv);

        const originalClose = dialog.Close.bind(dialog);
        dialog.Close = function() {
            snapshotManager.cleanup();
            removeOverlayIfExists(overlay);
            originalClose();
        };

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                dialog.Close();
            }
        });

        dialog.Open();

        setTimeout(() => {
            styleDialogForSharing(dialog);
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

        console.log('Styling dialog element:', dialogElement);

        dialogElement.style.position = 'fixed';
        dialogElement.style.top = '50%';
        dialogElement.style.left = '50%';
        dialogElement.style.transform = 'translate(-50%, -50%)';
        dialogElement.style.zIndex = '9999';
        dialogElement.style.maxWidth = '90%';
        dialogElement.style.maxHeight = '90%';
        dialogElement.style.overflow = 'auto';
    }

    function removeOverlayIfExists(overlay) {
        if (overlay && overlay.parentNode === document.body) {
            document.body.removeChild(overlay);
        }
    }

    return { showDialog };
}
