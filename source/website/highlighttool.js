import * as THREE from 'three';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';
import { DisposeThreeObjects } from '../engine/threejs/threeutils.js';

export class HighlightTool {
    static sharedHighlightMeshes = [];

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
        this.brushSize = 5;
        this.brushSizeSlider = null;
        this.touchStartTime = 0;
        this.longPressThreshold = 500; // ms
        this.isBrushSizeAdjusting = false;
        this.initialTouchDistance = 0;
        this.initialBrushSize = 0;
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

    ShowBrushSizeSlider() {
        if (this.brushSizeSlider) {
            this.brushSizeSlider.style.display = 'flex';
        }
    }

    HideBrushSizeSlider() {
        if (this.brushSizeSlider) {
            this.brushSizeSlider.style.display = 'none';
        }
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
            this.HideBrushSizeSlider();
        } else {
            this.ShowBrushSizeSliderForTouch();
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

    ShowBrushSizeSliderForTouch() {
        if (this.isTouchDevice()) {
            this.ShowBrushSizeSlider();
            // Position the slider for touch devices
            if (this.brushSizeSlider) {
                const canvas = this.viewer.GetCanvas();
                const rect = canvas.getBoundingClientRect();
                this.brushSizeSlider.style.position = 'fixed';
                this.brushSizeSlider.style.margin_top = '40px';
                this.brushSizeSlider.style.left = '3%';
                this.brushSizeSlider.style.zIndex = '1005';
            }
        }
    }

    isTouchDevice() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
    }

    // Mouse Events
    Click(mouseCoordinates, button) {
        if (!this.isActive) return;

        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return;
        }

        if (button === 0) {
            this.ApplyHighlight(intersection);
        } else if (button === 2) {
            this.RemoveHighlight(intersection);
        }

        this.UpdatePanel();
    }

    MouseMove(mouseCoordinates) {
        if (!this.isActive) return;

        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return;
        }

        if (this.isMouseDown) {
            if (this.mouseButton === 0) {
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
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshAndLine, mouseCoordinates);
        console.log("Touch start");
        if (intersection === null) {
            console.log("No intersection");
            // No intersection with model, allow navigation
            this.viewer.navigation.EnableCameraMovement(true);
            this.isNavigating = true;
        } else {
            console.log("Intersection");
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
            // console.log("TouchMove: No intersection");
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
        if (!this.isActive) return;
    
        this.activeTouches = event.touches.length;
    
        if (this.activeTouches === 0) {
            // All fingers lifted
            if (Date.now() - this.touchStartTime < this.longPressThreshold && !this.isBrushSizeAdjusting) {
                // Short touch: toggle highlight at last touch position
                let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, this.lastTouchPosition);
                if (intersection) {
                    this.ToggleHighlight(intersection);
                    this.viewer.Render();
                }
            }
            this.isBrushSizeAdjusting = false;
            this.HideBrushSizeSlider();
        }
    }

    ToggleHighlight(intersection) {
        let existingHighlight = this.GenerateHighlightMesh(intersection);
        if (existingHighlight) {
            this.RemoveHighlight(intersection);
        } else {
            this.ApplyHighlight(intersection);
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

    SetBrushSize(size) {
        this.brushSize = size;
        // Convert brush size from 1-10 range to actual size (e.g., 0.01 to 0.1)
        this.actualBrushSize = size / 10;
    }

    CreateBrushSizeSlider() {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'brush-size-slider';
        sliderContainer.style.display = 'none';
    
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '1';
        slider.max = '10';
        slider.value = this.brushSize.toString();
        slider.addEventListener('input', (event) => {
            this.SetBrushSize(parseInt(event.target.value));
        });
        slider.addEventListener('mousedown', () => {
            this.isInteractingWithSlider = true;
        });
        slider.addEventListener('mouseup', () => {
            this.isInteractingWithSlider = false;
        });
    
        const brushSizeDisplay = document.createElement('span');
        brushSizeDisplay.className = 'brush-size-display';
        brushSizeDisplay.textContent = this.brushSize + ' px';
    
        sliderContainer.appendChild(slider);
        sliderContainer.appendChild(brushSizeDisplay);
        this.brushSizeSlider = sliderContainer;
        return sliderContainer;
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
        let normals = mesh.geometry.attributes.normal;
        let highlightPositions = [];
        let highlightNormals = [];

        // Convert brush size to local space of the mesh
        // let localBrushSize = this.actualBrushSize / mesh.scale.x;
        let localBrushSize = 0.05 / mesh.scale.x;
        let localIntersectionPoint = intersection.point.clone().applyMatrix4(mesh.matrixWorld.invert());

        // First pass: collect faces within brush radius
        let facesWithinRadius = new Set();
        for (let i = 0; i < positions.count; i += 3) {
            let a = new THREE.Vector3().fromBufferAttribute(positions, i);
            let b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
            let c = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

            // Calculate face center
            let faceCenter = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);

            // Check if face center is within brush radius
            if (faceCenter.distanceTo(localIntersectionPoint) <= localBrushSize) {
                facesWithinRadius.add(i / 3);
            }
        }
        console.log("Faces within radius count: " + facesWithinRadius.size);

        // Second pass: include adjacent faces
        let facesToHighlight = new Set(facesWithinRadius);
        facesWithinRadius.forEach(faceIndex => {
            let a = new THREE.Vector3().fromBufferAttribute(positions, faceIndex * 3);
            let b = new THREE.Vector3().fromBufferAttribute(positions, faceIndex * 3 + 1);
            let c = new THREE.Vector3().fromBufferAttribute(positions, faceIndex * 3 + 2);

            // Check adjacent faces
            for (let i = 0; i < positions.count; i += 3) {
                if (facesToHighlight.has(i / 3)) continue;

                let d = new THREE.Vector3().fromBufferAttribute(positions, i);
                let e = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
                let f = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

                // If any vertex of this face is close to any vertex of the current face
                if (this.ArePointsClose(a, d, localBrushSize) || this.ArePointsClose(a, e, localBrushSize) || this.ArePointsClose(a, f, localBrushSize) ||
                    this.ArePointsClose(b, d, localBrushSize) || this.ArePointsClose(b, e, localBrushSize) || this.ArePointsClose(b, f, localBrushSize) ||
                    this.ArePointsClose(c, d, localBrushSize) || this.ArePointsClose(c, e, localBrushSize) || this.ArePointsClose(c, f, localBrushSize)) {
                    facesToHighlight.add(i / 3);
                }
            }
        });

        console.log("Faces to highlight count: " + facesToHighlight.size);

        // Add faces to highlight
        facesToHighlight.forEach(faceIndex => {
            let i = faceIndex * 3;
            let a = new THREE.Vector3().fromBufferAttribute(positions, i);
            let b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
            let c = new THREE.Vector3().fromBufferAttribute(positions, i + 2);

            highlightPositions.push(
                a.x, a.y, a.z,
                b.x, b.y, b.z,
                c.x, c.y, c.z
            );

            // Add corresponding normals (in local space)
            let na = new THREE.Vector3().fromBufferAttribute(normals, i);
            let nb = new THREE.Vector3().fromBufferAttribute(normals, i + 1);
            let nc = new THREE.Vector3().fromBufferAttribute(normals, i + 2);
            highlightNormals.push(
                na.x, na.y, na.z,
                nb.x, nb.y, nb.z,
                nc.x, nc.y, nc.z
            );
        });

        highlightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightPositions, 3));
        highlightGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(highlightNormals, 3));
        highlightGeometry.applyMatrix4(mesh.matrixWorld.invert());
        let highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);

        // Ensure the highlight mesh updates its matrix
        highlightMesh.updateMatrix();
        highlightMesh.updateMatrixWorld();

        return highlightMesh;
    }

    ArePointsClose(point1, point2, threshold) {
        return point1.distanceTo(point2) <= threshold;
    }

    UpdatePanel() {
        ClearDomElement(this.panel);

        let colorPicker = AddDiv(this.panel, 'ov_highlight_color_picker');
        colorPicker.innerHTML = '<input type="color" id="highlight-color" value="#ff0000">';
        colorPicker.addEventListener('change', (event) => {
            this.SetHighlightColor(event.target.value);
        });

        let brushSizeSlider = AddDiv(this.panel, 'ov_highlight_brush_size');
        brushSizeSlider.innerHTML = '<input type="range" id="brush-size" min="0.01" max="0.5" step="0.01" value="' + this.brushSize + '">';
        brushSizeSlider.addEventListener('input', (event) => {
            this.SetBrushSize(parseFloat(event.target.value));
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
