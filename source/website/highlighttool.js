import * as THREE from 'three';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';
import { DisposeThreeObjects } from '../engine/threejs/threeutils.js';
import { TrackUmamiEvent } from './umami.js';

export class HighlightTool {


    constructor(viewer, settings) {
        this.viewer = viewer;
        this.settings = settings;
        this.isActive = false;
        this.isMouseDown = false;
        this.mouseButton = null;
        this.highlightColor = new THREE.Color(1, 0, 0); // Default red color
        this.highlightMeshes = HighlightTool.sharedHighlightMeshes;
        this.panel = null;
        this.button = null;
        this.eventsInitialized = null;
        this.activeTouches = 0;
        this.overlappingMeshes = new Map();
    }

    InitEvents() {

        const canvas = this.viewer.GetCanvas();
        canvas.addEventListener('mousedown', (event) => {
            if (this.isActive) {
                this.isMouseDown = true;
                this.mouseButton = event.button;
            }
        });

        canvas.addEventListener('mouseup', (event) => {
            if (this.isActive) {
                this.isMouseDown = false;
                this.mouseButton = null;
            }
        });

        this.addTouchListeners (canvas)

    }

    addTouchListeners (canvas) {
        canvas.addEventListener('touchstart', (event) => {
            if (this.isActive) {
                this.TouchStart(event);
            }
        }, { passive: false });

        canvas.addEventListener('touchmove', (event) => {
            if (this.isActive) {
                this.TouchMove(event);
            }
        }, { passive: false });

        canvas.addEventListener('touchend', (event) => {
            if (this.isActive) {
                this.TouchEnd(event);
            }
        }, { passive: false });

        canvas.addEventListener('touchcancel', (event) => {
            if (this.isActive) {
                this.TouchEnd(event);
            }
        });
    }

    remove

    SetButton (button) {
        this.button = button;
    }

    IsActive () {
        return this.isActive;
    }

    SetActive(isActive) {
        if (this.isActive === isActive) {
            return;
        }

        TrackUmamiEvent('Highlight Tool Activation', { selected: isSelected });

    
        this.isActive = isActive;
        this.button.SetSelected(isActive);
        
        // Update the viewer button
        let viewerButton = document.getElementById('highlight-button');
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
            this.panel = AddDiv(document.body, 'ov_highlight_panel');
            this.UpdatePanel();
            this.Resize();
        } else {
            if (this.panel) {
                this.panel.remove();
                this.panel = null;
            }
        }
    }


    // Mouse Events
    Click (mouseCoordinates, button) {
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return;
        }

        if (this.mouseButton === 0) {
            this.ApplyHighlight(intersection);
        } else if (this.mouseButton === 2) {
            this.RemoveHighlight(intersection);
        }

        this.UpdatePanel();
    }

    MouseMove(mouseCoordinates) {
        if (!this.isActive) {
            return;
        }
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            // No intersection, don't do anything
            return;
        }
        // Existing highlight logic here
        if (this.isMouseDown) {
            if (this.mouseButton === 0 ) {
                this.ApplyHighlight(intersection);
            } else if (this.mouseButton === 2) {
                this.RemoveHighlight(intersection);
            }
        }
        this.viewer.Render();
    }

    // Touch Events
    TouchStart(event) {
        event.preventDefault();
        this.activeTouches = event.touches.length;
        this.isTouching = true;

        let mouseCoordinates = this.viewer.navigation.touch.GetPosition();
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);

        if (intersection === null) {
            // No intersection with model, allow navigation
            this.viewer.navigation.EnableCameraMovement(true);
            this.isNavigating = true;
        } else {
            // Intersection with model, use highlight tool
            this.viewer.navigation.EnableCameraMovement(false);
            this.isNavigating = false;
            if (this.activeTouches === 1) {
                this.ApplyHighlight(intersection);
            } else if (this.activeTouches === 2) {
                this.RemoveHighlight(intersection);
            }
        }
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
        
        if (this.activeTouches === 1) {
            this.ApplyHighlight(intersection);
        } else if (this.activeTouches === 2) {
            this.RemoveHighlight(intersection);
        }
        this.viewer.Render();
    }

    TouchEnd(event) {
        event.preventDefault();
        this.activeTouches = event.touches.length;
        if (this.activeTouches === 0) {
            this.isTouching = false;
            this.isNavigating = false;
            this.viewer.navigation.EnableCameraMovement(true);
        }
    }
    
    ApplyHighlight(intersection) {
        let highlightMesh = this.GenerateHighlightMesh(intersection);
        
        // Check for overlapping meshes
        let overlappingMeshes = this.GetOverlappingMeshes(highlightMesh);
        
        if (overlappingMeshes.length >= this.maxOverlappingMeshes) {
            // Remove the oldest overlapping mesh
            let oldestMesh = overlappingMeshes[0];
            this.RemoveHighlight({ point: oldestMesh.position });
            overlappingMeshes.shift();
        }
        
        // Add the new mesh
        HighlightTool.sharedHighlightMeshes.push(highlightMesh);
        this.viewer.AddExtraObject(highlightMesh);
        
        // Update overlapping meshes
        overlappingMeshes.push(highlightMesh);
        this.overlappingMeshes.set(highlightMesh.uuid, overlappingMeshes);
        
        this.viewer.Render();
    }

    GetOverlappingMeshes(newMesh) {
        let overlapping = [];
        let newBoundingBox = new THREE.Box3().setFromObject(newMesh);
        
        for (let mesh of this.highlightMeshes) {
            let meshBoundingBox = new THREE.Box3().setFromObject(mesh);
            if (newBoundingBox.intersectsBox(meshBoundingBox)) {
                overlapping.push(mesh);
            }
        }
        
        return overlapping;
    }
    
    RemoveHighlight(intersection) {        
        if (!intersection || !intersection.point) {
            return;
        }
    
        let meshesToRemove = HighlightTool.sharedHighlightMeshes.filter((mesh) => {
            let boundingBox = new THREE.Box3().setFromObject(mesh);
            boundingBox.expandByScalar(0.01); // Expand the bounding box slightly
            let isWithinBoundingBox = boundingBox.containsPoint(intersection.point);
            return isWithinBoundingBox;
        });
    
        if (meshesToRemove.length === 0) {
            return;
        }
    
        meshesToRemove.forEach((mesh) => {
            this.viewer.RemoveExtraObject(mesh);
            
            // Update highlightMeshes array
            HighlightTool.sharedHighlightMeshes = HighlightTool.sharedHighlightMeshes.filter((m) => m !== mesh);
            
            // Dispose of the highlight mesh
            this.DisposeHighlightMesh(mesh);
    
            // Update overlappingMeshes
            this.overlappingMeshes.delete(mesh.uuid);
            for (let [key, value] of this.overlappingMeshes) {
                let filteredValue = value.filter(m => m !== mesh);
                this.overlappingMeshes.set(key, filteredValue);
            }
        });
    
        this.viewer.Render();
    }

    SetMaxOverlappingMeshes(limit) {
        if (typeof limit === 'number' && limit > 0) {
            this.maxOverlappingMeshes = Math.floor(limit);
        } else {
            console.error('Invalid overlap limit. Please provide a positive number.');
        }
    }

    DisposeHighlightMesh(mesh) {
        DisposeThreeObjects(mesh);
        this.viewer.scene.remove (mesh);
        this.viewer.Render();  
    }

    IsIntersectionWithinBoundingBox(intersection, mesh) {
        let boundingBox = new THREE.Box3().setFromObject(mesh);
        let result = boundingBox.containsPoint(intersection.point);
        return result;
    }

    IsIntersectionWithinMesh(intersection, mesh) {
        let positions = mesh.geometry.attributes.position.array;
        let threshold = 0.1; // Adjust the threshold as needed

        for (let i = 0; i < positions.length; i += 9) {
            let a = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
            let b = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
            let c = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);

            if (this.ArePointsClose(intersection.point, a, threshold) ||
                this.ArePointsClose(intersection.point, b, threshold) ||
                this.ArePointsClose(intersection.point, c, threshold)) {
                return true;
            }
        }
        return false;
    }

    ArePointsClose(point1, point2, threshold) {
        return point1.distanceTo(point2) < threshold;
    }

    GenerateHighlightMesh(intersection) {
        let mesh = intersection.object;
        let highlightMaterial = new THREE.MeshPhongMaterial({
            color: this.highlightColor,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1
        });

        let highlightGeometry = new THREE.BufferGeometry();
        let positions = mesh.geometry.attributes.position;

        let a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        a.fromBufferAttribute(positions, intersection.face.a);
        b.fromBufferAttribute(positions, intersection.face.b);
        c.fromBufferAttribute(positions, intersection.face.c);

        highlightGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
            a.x, a.y, a.z,
            b.x, b.y, b.z,
            c.x, c.y, c.z
        ], 3));

        let normal = new THREE.Vector3();
        normal.crossVectors(b.clone().sub(a), c.clone().sub(a)).normalize();
        highlightGeometry.setAttribute('normal', new THREE.Float32BufferAttribute([
            normal.x, normal.y, normal.z,
            normal.x, normal.y, normal.z,
            normal.x, normal.y, normal.z
        ], 3));

        let highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
        highlightMesh.applyMatrix4(mesh.matrixWorld);
        let offset = normal.multiplyScalar(0.001);
        highlightMesh.position.add(offset);

        return highlightMesh;
    }

    UpdatePanel() {
        ClearDomElement(this.panel);

        let colorPicker = AddDiv(this.panel, 'ov_highlight_color_picker');
        colorPicker.innerHTML = '<input type="color" id="highlight-color" value="#ff0000">';
        colorPicker.addEventListener('change', (event) => {
            this.SetHighlightColor(event.target.value);
        });

        let clearButton = AddDiv(this.panel, 'ov_highlight_clear_button');
        clearButton.innerHTML = '<button>Clear Highlight</button>';
        clearButton.addEventListener('click', () => {
            this.ClearHighlight();
        });

        this.Resize();
    }

    Resize() {
        if (!this.isActive) {
            return;
        }
        let canvas = this.viewer.GetCanvas();
        let canvasRect = canvas.getBoundingClientRect();
        let panelRect = this.panel.getBoundingClientRect();
        let canvasWidth = canvasRect.right - canvasRect.left;
        let panelWidth = panelRect.right - panelRect.left;
        this.panel.style.left = (canvasRect.left + (canvasWidth - panelWidth) / 2) + 'px';
        this.panel.style.top = (canvasRect.top + 10) + 'px';
    }

    ClearHighlight() {
        HighlightTool.sharedHighlightMeshes.forEach((mesh) => {
            this.viewer.RemoveExtraObject(mesh);
        });
        HighlightTool.sharedHighlightMeshes = [];
        this.viewer.Render();
    }

    SetHighlightColor(color) {
        this.highlightColor.set(color);
    }
}

HighlightTool.sharedHighlightMeshes = [];
