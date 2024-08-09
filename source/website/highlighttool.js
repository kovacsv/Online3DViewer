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
        this.intensityMap = new Map(); // To store intensity values for each mesh
        this.maxIntensity = 100; // Maximum intensity value
        this.intensityIncreaseRate = 5; // How fast the intensity increases
        this.lastInteractionTime = null; // To track the duration of interaction
        this.brushSize = 3; // Default brush size
    }

    InitEvents() {

        const canvas = this.viewer.GetCanvas();
        canvas.addEventListener('mousedown', (event) => {
            if (this.isActive) {
                this.isMouseDown = true;
                this.mouseButton = event.button;
                this.HideBrushSizeSlider();
            }
        });

        canvas.addEventListener('mouseup', (event) => {
            if (this.isActive) {
                this.isMouseDown = false;
                this.mouseButton = null;
                this.ResetIntensity();
            }
        });
        this.addTouchListeners (canvas);
    }

    ShowBrushSizeSlider() {
        console.log('ShowBrushSizeSlider');
        if (this.brushSizeSlider) {
            this.brushSizeSlider.style.display = 'block';
            this.brushSizeSlider.style.position = 'absolute';
            this.brushSizeSlider.style.top = '10%';
        }
    }

    HideBrushSizeSlider() {
        console.log('HideBrushSizeSlider');
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

        TrackUmamiEvent('Highlight Tool Activation');


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
            this.ShowBrushSizeSlider();
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
        this.HideBrushSizeSlider();
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
        this.ResetIntensity();
    }

    ApplyHighlight(intersection) {
        let highlightedMeshes = this.GenerateHighlightMesh(intersection);
        highlightedMeshes.forEach(({ mesh: highlightMesh, id: uniqueId }) => {
            let existingMesh = this.FindExistingMeshById(uniqueId);
            if (existingMesh) {
                this.IncreaseIntensity(existingMesh);
                this.UpdateMeshColor(existingMesh);
            } else {
                this.intensityMap.set(uniqueId, 0);
                HighlightTool.sharedHighlightMeshes.push({ mesh: highlightMesh, id: uniqueId });
                this.viewer.AddExtraObject(highlightMesh);
                this.UpdateMeshColor(highlightMesh);
            }
        });
        this.viewer.Render();
    }

    FindExistingMeshById(id) {
        return HighlightTool.sharedHighlightMeshes.find(item => item.id === id)?.mesh;
    }

    ResetIntensity() {
        this.lastInteractionTime = null;
    }

    IncreaseIntensity(mesh) {
        let uniqueId = HighlightTool.sharedHighlightMeshes.find(item => item.mesh === mesh)?.id;
        if (!uniqueId) return;

        let currentIntensity = this.intensityMap.get(uniqueId) || 0;
        let newIntensity = Math.min(currentIntensity + this.intensityIncreaseRate, this.maxIntensity);
        this.intensityMap.set(uniqueId, newIntensity);
    }

    UpdateMeshColor(mesh) {
        let uniqueId = HighlightTool.sharedHighlightMeshes.find(item => item.mesh === mesh)?.id;
        if (!uniqueId) return;

        let intensity = this.intensityMap.get(uniqueId) || 0;
        let color = this.GetColorForIntensity(intensity);
        mesh.material.color.setStyle(color);
    }

    GetColorForIntensity(intensity) {
        let normalizedIntensity = intensity / this.maxIntensity;
        if (normalizedIntensity < 0.5) {
            // Yellow to Orange
            return `rgb(255, ${Math.round(255 - normalizedIntensity * 255)}, 0)`;
        } else {
            // Orange to Red
            return `rgb(255, ${Math.round(255 - (normalizedIntensity - 0.5) * 510)}, 0)`;
        }
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
        let highlightedMeshes = this.GenerateHighlightMesh(intersection);
        
        highlightedMeshes.forEach(({ id: uniqueId }) => {
            let meshToRemove = HighlightTool.sharedHighlightMeshes.find(item => item.id === uniqueId);
            let existingMesh = this.FindExistingMeshById(uniqueId);
            let currentIntensity = this.intensityMap.get(uniqueId) || 0;
    
            if (meshToRemove) {
                if (currentIntensity >= 3) {
                    let newIntensity = Math.max(currentIntensity - (this.intensityIncreaseRate * 0.7), 0);
                    this.intensityMap.set(uniqueId, newIntensity);
                    this.UpdateMeshColor(existingMesh);
                } else {
                    this.viewer.RemoveExtraObject(meshToRemove.mesh);
                    HighlightTool.sharedHighlightMeshes = HighlightTool.sharedHighlightMeshes.filter((item) => item.id !== uniqueId);
                    this.DisposeHighlightMesh(meshToRemove.mesh);
    
                    this.overlappingMeshes.delete(uniqueId);
                    for (let [key, value] of this.overlappingMeshes) {
                        let filteredValue = value.filter(item => item.id !== uniqueId);
                        this.overlappingMeshes.set(key, filteredValue);
                    }
                }
                this.viewer.Render();
            }
        });
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

    ArePointsClose (point1, point2, threshold) {
        return point1.distanceTo(point2) < threshold;
    }

    GenerateHighlightMesh(intersection) {
        let mesh = intersection.object;
        let highlightedMeshes = [];
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
    
        let positions = mesh.geometry.attributes.position;
        let normals = mesh.geometry.attributes.normal;
    
        let localBrushSize = this.brushSize / mesh.scale.x / 100;
        console.log('GenerateHighlightMesh: localBrushSize :', localBrushSize);
        let localIntersectionPoint = intersection.point.clone().applyMatrix4(mesh.matrixWorld.invert());
    
        // First pass: collect faces within brush radius
        let facesWithinRadius = new Set();
        for (let i = 0; i < positions.count; i += 3) {
            let a = new THREE.Vector3().fromBufferAttribute(positions, i);
            let b = new THREE.Vector3().fromBufferAttribute(positions, i + 1);
            let c = new THREE.Vector3().fromBufferAttribute(positions, i + 2);
    
            let faceCenter = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    
            if (faceCenter.distanceTo(localIntersectionPoint) <= localBrushSize) {
                facesWithinRadius.add(i / 3);
            }
        }
    
        let facesToHighlight = new Set(facesWithinRadius);        
        facesToHighlight.forEach(faceIndex => {
            let idx = faceIndex * 3;
            let positionsArray = [];
            let normalsArray = [];
        
            let normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld);
    
            for (let j = 0; j < 3; j++) {
                let position = new THREE.Vector3(
                    positions.getX(idx + j),
                    positions.getY(idx + j),
                    positions.getZ(idx + j)
                );
                let rotationMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);  // Rotate by 90 degrees around Y axis
                position.applyMatrix4(rotationMatrix);
                positionsArray.push(position.x, position.y, position.z);
                
                let normal = new THREE.Vector3(
                    normals.getX(idx + j),
                    normals.getY(idx + j),
                    normals.getZ(idx + j)
                )
                normal.applyMatrix3(normalMatrix).normalize().negate();
                normalsArray.push(normal.x, normal.y, normal.z);
            }
        
            let highlightGeometry = new THREE.BufferGeometry();
            highlightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positionsArray, 3));
            highlightGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalsArray, 3));
            
            let highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial.clone());
            highlightMesh.updateMatrix();
            highlightMesh.updateMatrixWorld();
            let uniqueId = `highlight_${mesh.id}_${faceIndex}`;
            highlightedMeshes.push({ mesh: highlightMesh, id: uniqueId });
        });
        
        return highlightedMeshes;
    }

    CreateHighlightMesh(originalMesh, faceIndex, indices, positions) {
        let highlightMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(1, 1, 0),
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
        
        let a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
        let i = faceIndex * 3;
        if (indices) {
            a.fromBufferAttribute(positions, indices[i]);
            b.fromBufferAttribute(positions, indices[i + 1]);
            c.fromBufferAttribute(positions, indices[i + 2]);
        } else {
            a.fromBufferAttribute(positions, i);
            b.fromBufferAttribute(positions, i + 1);
            c.fromBufferAttribute(positions, i + 2);
        }

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
        highlightMesh.applyMatrix4(originalMesh.matrixWorld);
        let offset = normal.multiplyScalar(0.01);
        highlightMesh.position.add(offset);

        return highlightMesh;
    }

    UpdatePanel() {
        ClearDomElement(this.panel);

        // Add brush size slider
        this.brushSizeSlider = AddDiv(this.panel, 'ov_highlight_brush_size_slider');
        this.brushSizeSlider.innerHTML = `
            <label for="brush-size">Brush Size: </label>
            <input type="range" id="brush-size" min="1" max="7" value="${this.brushSize}">
        `;
        let brushSizeInput = this.brushSizeSlider.querySelector('#brush-size');
        let brushSizeValue = this.brushSizeSlider.querySelector('#brush-size-value');
        brushSizeInput.addEventListener('input', (event) => {
            this.brushSize = parseInt(event.target.value);
            console.log('UpdatePanel: Brush size:', this.brushSize);
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
