import * as THREE from 'three';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { HighlightTool } from './highlighttool.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';

export class EraserTool extends HighlightTool {
    constructor(viewer, settings) {
        super(viewer, settings);
        this.highlightColor = new THREE.Color('rgba(0, 0, 0, 0)');
        this.highlightMeshes = HighlightTool.sharedHighlightMeshes;
    }

    SetActive(isActive) {
        if (this.isActive === isActive) {
            return;
        }

        this.isActive = isActive;
        this.button.SetSelected(isActive);

        let viewerButton = document.getElementById('erase-button');
        if (viewerButton) {
            viewerButton.classList.toggle('active', isActive);
        }

        if (!isActive) {
            this.viewer.navigation.EnableCameraMovement(true);
            this.isNavigating = false;
        }

        if (!this.eventsInitialized) {
            this.InitEvents();
            this.eventsInitialized = true;
        }

        if (this.isActive) {
            this.panel = AddDiv(document.body, 'ov_erase_panel');
            this.UpdatePanel();
            this.Resize();
        } else {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
        }
    }

    MouseMove(mouseCoordinates) {
        if (!this.isActive) {
            return;
        }
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return;
        }
        
        // Only remove highlights if the mouse button is down
        if (this.isMouseDown) {
            this.RemoveHighlight(intersection);
            this.viewer.Render();
        }
    }

    Click(mouseCoordinates, button) {
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return;
        }
    
        this.RemoveHighlight(intersection);
        this.viewer.Render();
    }

    TouchMove(event) {
        event.preventDefault();
        if (!this.isTouching) {
            return;
        }

        this.activeTouches = event.touches.length;
        let mouseCoordinates = this.viewer.navigation.touch.GetPosition();
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);

        if (this.isNavigating) {
            // If we started navigating, don't switch to highlighting
            return;
        }

        if (intersection === null) {
            return;
        }

        if (this.activeTouches === 1 || this.activeTouches === 2) {
            this.RemoveHighlight(intersection);
        }
        this.viewer.Render();
    }

    UpdatePanel() {
        ClearDomElement(this.panel);

        let clearButton = AddDiv(this.panel, 'ov_erase_clear_button');
        clearButton.innerHTML = '<button>Clear All Highlights</button>';
        clearButton.addEventListener('click', () => {
            this.ClearHighlight();
        });

        this.Resize();
    }

    ClearHighlight() {
        HighlightTool.sharedHighlightMeshes.forEach((mesh) => {
            this.viewer.RemoveExtraObject(mesh);
        });
        HighlightTool.sharedHighlightMeshes = [];
        this.viewer.Render();
    }
}