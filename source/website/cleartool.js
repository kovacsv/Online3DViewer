import { HighlightTool } from './highlighttool.js';
import { AddDiv } from '../engine/viewer/domutils.js';

export class ClearAllTool extends HighlightTool {
    constructor(viewer, settings) {
        super(viewer, settings);
        this.name = 'ClearAll';
    }

    SetActive(isActive) {
        if (this.isActive === isActive) {
            return;
        }

        this.isActive = isActive;
        this.button.SetSelected(isActive);

        let viewerButton = document.getElementById('clear-all-button');
        if (viewerButton) {
            viewerButton.classList.toggle('active', isActive);
        }

        if (this.isActive) {
            this.panel = AddDiv(document.body, 'ov_clear_all_panel');
            this.UpdatePanel();
            this.Resize();
        } else {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
        }
    }

    UpdatePanel() {
        if (!this.panel) return;

        this.panel.innerHTML = '';
        let clearButton = AddDiv(this.panel, 'ov_clear_all_button');
        clearButton.innerHTML = '<button>Clear All Highlights</button>';
        clearButton.addEventListener('click', () => {
            this.ClearAllHighlights();
        });

        this.Resize();
    }

    ClearAllHighlights() {
        HighlightTool.sharedHighlightMeshes.forEach((meshItem) => {
            this.viewer.RemoveExtraObject(meshItem.mesh);
            this.DisposeHighlightMesh(meshItem.mesh);
        });
    
        HighlightTool.sharedHighlightMeshes = [];
    
        // Clear the overlappingMeshes map
        this.overlappingMeshes.clear();
    
        this.viewer.Render();
    }
    

    Click() {
        // Immediately clear all highlights when the tool is clicked
        this.ClearAllHighlights();
    }
}