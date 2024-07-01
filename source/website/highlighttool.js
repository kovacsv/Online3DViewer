import * as THREE from 'three';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { IntersectionMode } from '../engine/viewer/viewermodel.js';
import { DisposeThreeObjects } from '../engine/threejs/threeutils.js';

export class HighlightTool {
    constructor(viewer, settings) {
        this.viewer = viewer;
        this.settings = settings;
        this.isActive = false;
        this.isMouseDown = false;
        this.mouseButton = null;
        this.highlightColor = new THREE.Color(1, 0, 0); // Default red color
        this.highlightMeshes = [];
        this.panel = null;
        this.button = null;

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
            // });
        }, { passive: false });

        canvas.addEventListener('touchmove', (event) => {
            if (this.isActive) {
                this.TouchMove(event);
            }
            // });
        }, { passive: false });

        canvas.addEventListener('touchend', (event) => {
            if (this.isActive) {
                this.TouchEnd(event);
            }
            // });
        }, { passive: false });

        canvas.addEventListener('touchcancel', (event) => {
            if (this.isActive) {
                this.TouchEnd(event);
            }
        });
    }

    SetButton(button) {
        this.button = button;
    }

    IsActive() {
        return this.isActive;
    }

    SetActive(isActive) {
        if (this.isActive === isActive) {
            return;
        }
        this.isActive = isActive;
        this.button.SetSelected(isActive);
        this.viewer.navigation.EnableCameraMovement(!isActive);

        // Touch & Mouse event bindings
        this.InitEvents();
        
        if (this.isActive) {
            this.panel = AddDiv(document.body, 'ov_highlight_panel');
            this.UpdatePanel();
            this.Resize();
        } else {
            this.panel.remove();
        }
    }


    // Mouse Events
    Click (mouseCoordinates, button) {
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
        if (!this.isMouseDown) {
            return;
        }

        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
        if (intersection === null) {
            return;
        }

        if (this.mouseButton === 0) {
            this.ApplyHighlight(intersection);
        } else if (this.mouseButton === 2) {
            this.RemoveHighlight(intersection);
        }

        this.viewer.Render();
    }

    // Touch Events
    TouchStart(event) {
        event.preventDefault();
        this.isTouching = true;

        let mouseCoordinates = this.viewer.navigation.touch.GetPosition();
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);

        if (intersection !== null) {
            this.ApplyHighlight(intersection);
            this.viewer.Render();
        }
    }
    
    TouchMove(event) {
        event.preventDefault();
        if (!this.isTouching) {
            return;
        }
    
        let mouseCoordinates = this.viewer.navigation.touch.GetPosition();
        let intersection = this.viewer.GetMeshIntersectionUnderMouse(IntersectionMode.MeshOnly, mouseCoordinates);
    
        if (intersection === null) {
            console.log('Intersection is null');
            return;
        }
    
        this.ApplyHighlight(intersection);
        this.viewer.Render();
    }
    
    TouchEnd(event) {
        event.preventDefault();
        this.isTouching = false;
    }
    

    ApplyHighlight(intersection) {
        let highlightMesh = this.GenerateHighlightMesh(intersection);
        this.highlightMeshes.push(highlightMesh);
        this.viewer.AddExtraObject(highlightMesh);
    }

    RemoveHighlight(intersection) {
        let meshToRemove = this.highlightMeshes.find((mesh) => {
            return this.IsIntersectionWithinBoundingBox(intersection, mesh);
        });

        if (meshToRemove) {
            this.viewer.RemoveExtraObject(meshToRemove);
            this.highlightMeshes = this.highlightMeshes.filter((mesh) => mesh !== meshToRemove);
            this.DisposeHighlightMesh(meshToRemove); // Properly dispose of the mesh
            this.viewer.Render();
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
        this.highlightMeshes.forEach((mesh) => {
            this.viewer.RemoveExtraObject(mesh);
        });
        this.highlightMeshes = [];
        this.viewer.Render();
    }

    SetHighlightColor(color) {
        this.highlightColor.set(color);
    }
}
