import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';
import { Loc } from '../engine/core/localization.js';
import * as THREE from 'three';

export class ExplodeTool {
    constructor(viewer, settings) {
        this.viewer = viewer;
        this.settings = settings;
        this.isActive = false;
        this.explodeValue = 0.0;
        this.originalPositions = new Map();
        this.originalEdgePositions = new Map();
        this.meshToEdgeMap = new Map(); // Maps mesh uuid to edge uuid
        this.modelCenter = new THREE.Vector3();
        this.boundingSphereRadius = 0.0;

        this.panel = null;
        this.slider = null;
        this.button = null;
        this.separator = null;
    }

    SetButton(button) {
        this.button = button;
    }

    SetSeparator(separator) {
        this.separator = separator;
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
        if (this.isActive) {
            let meshCount = this.InitializeExplode();
            if (meshCount <= 1) {
                // Not enough meshes to explode, deactivate
                this.isActive = false;
                this.button.SetSelected(false);
                return;
            }
            this.CreatePanel();
            this.Resize();
        } else {
            this.ResetExplode();
            this.panel.remove();
            this.panel = null;
            this.slider = null;
        }
    }

    GetMeshCount() {
        let meshCount = 0;
        this.viewer.EnumerateMeshesAndLines((obj) => {
            obj.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                }
            });
        });
        return meshCount;
    }

    UpdateButtonVisibility() {
        let meshCount = this.GetMeshCount();
        if (meshCount <= 1) {
            this.button.AddClass('ov_hidden');
            if (this.separator) {
                this.separator.classList.add('ov_hidden');
            }
        } else {
            this.button.RemoveClass('ov_hidden');
            if (this.separator) {
                this.separator.classList.remove('ov_hidden');
            }
        }
    }

    InitializeExplode() {
        // Calculate the center of the model
        let boundingSphere = this.viewer.GetBoundingSphere((meshUserData) => {
            return true;
        });

        this.modelCenter.copy(boundingSphere.center);
        this.boundingSphereRadius = boundingSphere.radius;

        // Store original positions and mesh centers for ALL meshes (including nested ones)
        this.originalPositions.clear();
        this.originalEdgePositions.clear();
        this.meshToEdgeMap.clear();
        let meshCount = 0;

        // Get the scene's root object and traverse EVERYTHING
        this.viewer.EnumerateMeshesAndLines((obj) => {
            // Traverse this object and all its children
            obj.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;

                    // Update world matrices first!
                    child.updateMatrixWorld(true);

                    // Store original LOCAL position
                    let originalLocalPos = new THREE.Vector3();
                    originalLocalPos.copy(child.position);

                    // Get the mesh's world position
                    let worldPos = new THREE.Vector3();
                    child.getWorldPosition(worldPos);

                    // Calculate the mesh's geometric center (in world space)
                    if (!child.geometry.boundingBox) {
                        child.geometry.computeBoundingBox();
                    }
                    let boundingBox = child.geometry.boundingBox;
                    let meshCenter = new THREE.Vector3();
                    boundingBox.getCenter(meshCenter);

                    // Transform to world space
                    let worldCenter = meshCenter.clone();
                    child.localToWorld(worldCenter);

                    // Calculate direction from model center to mesh center
                    let direction = new THREE.Vector3();
                    direction.subVectors(worldCenter, this.modelCenter);

                    // If the mesh is at the center, generate a random direction NOW (not later)
                    if (direction.length() < 0.001) {
                        direction.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
                        direction.normalize();
                    } else {
                        direction.normalize();
                    }

                    this.originalPositions.set(child.uuid, {
                        localPosition: originalLocalPos,
                        worldPosition: worldPos,
                        center: worldCenter,
                        direction: direction,
                        parent: child.parent,
                        userData: child.userData
                    });
                }
            });
        });

        // Store original edge positions and map them to their meshes
        this.viewer.EnumerateEdges((edge) => {
            edge.updateMatrixWorld(true);

            // Store original position
            let originalLocalPos = new THREE.Vector3();
            originalLocalPos.copy(edge.position);

            // Get world position
            let worldPos = new THREE.Vector3();
            edge.getWorldPosition(worldPos);

            this.originalEdgePositions.set(edge.uuid, {
                localPosition: originalLocalPos,
                worldPosition: worldPos,
                parent: edge.parent,
                userData: edge.userData
            });

            // Find the corresponding mesh using userData
            // Edge userData should match mesh userData
            for (let [meshUuid, meshData] of this.originalPositions.entries()) {
                if (meshData.userData === edge.userData) {
                    this.meshToEdgeMap.set(meshUuid, edge.uuid);
                    break;
                }
            }
        });

        return meshCount;
    }

    SetExplodeValue(value) {
        this.explodeValue = value;
        this.ApplyExplode();
        this.viewer.Render();
    }

    RefreshEdges() {
        // This method should be called when edges are toggled on during explode
        // It will initialize the edge positions and apply the current explode state
        if (!this.isActive) {
            return;
        }

        // Clear existing edge data
        this.originalEdgePositions.clear();
        this.meshToEdgeMap.clear();

        // Store original edge positions and map them to their meshes
        this.viewer.EnumerateEdges((edge) => {
            edge.updateMatrixWorld(true);

            // Store original position (in current exploded state)
            let originalLocalPos = new THREE.Vector3();
            originalLocalPos.copy(edge.position);

            // Get world position
            let worldPos = new THREE.Vector3();
            edge.getWorldPosition(worldPos);

            // We need to "unexplode" the world position to get the true original
            // Find the corresponding mesh
            let correspondingMeshData = null;
            for (let [meshUuid, meshData] of this.originalPositions.entries()) {
                if (meshData.userData === edge.userData) {
                    correspondingMeshData = meshData;
                    this.meshToEdgeMap.set(meshUuid, edge.uuid);
                    break;
                }
            }

            // If we found the mesh, calculate the original edge position
            if (correspondingMeshData) {
                // The edge was just generated at the mesh's current (exploded) position
                // We need to store what the original position would have been
                let maxDistance = this.boundingSphereRadius * 2.0;
                let direction = correspondingMeshData.direction.clone();
                let offset = direction.multiplyScalar(maxDistance * this.explodeValue);

                // The current world position includes the explode offset
                // So the original world position is current minus offset
                let originalWorldPos = new THREE.Vector3();
                originalWorldPos.subVectors(worldPos, offset);

                this.originalEdgePositions.set(edge.uuid, {
                    localPosition: originalLocalPos,
                    worldPosition: originalWorldPos,
                    parent: edge.parent,
                    userData: edge.userData
                });

                // Now apply the explode to this edge (it will be applied in ApplyExplode)
            } else {
                // No corresponding mesh found, just store current position
                this.originalEdgePositions.set(edge.uuid, {
                    localPosition: originalLocalPos,
                    worldPosition: worldPos,
                    parent: edge.parent,
                    userData: edge.userData
                });
            }
        });

        // Apply current explode state to the new edges
        if (this.explodeValue > 0) {
            this.ApplyExplode();
        }
    }

    ApplyExplode() {
        let maxDistance = this.boundingSphereRadius * 2.0;

        // Traverse ALL objects including nested children
        this.viewer.EnumerateMeshesAndLines((obj) => {
            obj.traverse((child) => {
                if (child.isMesh) {
                    let meshData = this.originalPositions.get(child.uuid);
                    if (meshData) {
                        // Use the pre-calculated direction (already normalized)
                        let direction = meshData.direction.clone();

                        // Apply explode offset in world space
                        let offset = direction.multiplyScalar(maxDistance * this.explodeValue);
                        let newWorldPos = new THREE.Vector3();
                        newWorldPos.addVectors(meshData.worldPosition, offset);

                        // Convert world position back to local position
                        if (child.parent) {
                            let parentWorldMatrix = new THREE.Matrix4();
                            child.parent.matrixWorld.decompose(
                                new THREE.Vector3(),
                                new THREE.Quaternion(),
                                new THREE.Vector3()
                            );

                            // Transform world position to parent's local space
                            let parentInverse = new THREE.Matrix4();
                            parentInverse.copy(child.parent.matrixWorld).invert();
                            let newLocalPos = newWorldPos.clone();
                            newLocalPos.applyMatrix4(parentInverse);

                            child.position.copy(newLocalPos);
                        } else {
                            // No parent, world = local
                            child.position.copy(newWorldPos);
                        }

                        child.updateMatrix();
                    }
                }
            });
        });

        // Apply the same transformation to edges
        this.viewer.EnumerateEdges((edge) => {
            let edgeData = this.originalEdgePositions.get(edge.uuid);
            if (edgeData) {
                // Find the corresponding mesh for this edge
                let correspondingMeshUuid = null;
                for (let [meshUuid, edgeUuid] of this.meshToEdgeMap.entries()) {
                    if (edgeUuid === edge.uuid) {
                        correspondingMeshUuid = meshUuid;
                        break;
                    }
                }

                if (correspondingMeshUuid) {
                    let meshData = this.originalPositions.get(correspondingMeshUuid);
                    if (meshData) {
                        // Use the same direction and offset as the mesh
                        let direction = meshData.direction.clone();
                        let offset = direction.multiplyScalar(maxDistance * this.explodeValue);
                        let newWorldPos = new THREE.Vector3();
                        newWorldPos.addVectors(edgeData.worldPosition, offset);

                        // Convert world position back to local position
                        if (edge.parent) {
                            let parentInverse = new THREE.Matrix4();
                            parentInverse.copy(edge.parent.matrixWorld).invert();
                            let newLocalPos = newWorldPos.clone();
                            newLocalPos.applyMatrix4(parentInverse);

                            edge.position.copy(newLocalPos);
                        } else {
                            // No parent, world = local
                            edge.position.copy(newWorldPos);
                        }

                        edge.updateMatrix();
                    }
                }
            }
        });
    }

    ResetExplode() {
        // Reset all meshes to their original positions
        this.viewer.EnumerateMeshesAndLines((obj) => {
            obj.traverse((child) => {
                if (child.isMesh) {
                    let meshData = this.originalPositions.get(child.uuid);
                    if (meshData) {
                        child.position.copy(meshData.localPosition);
                        child.updateMatrix();
                    }
                }
            });
        });

        // Reset all edges to their original positions
        this.viewer.EnumerateEdges((edge) => {
            let edgeData = this.originalEdgePositions.get(edge.uuid);
            if (edgeData) {
                edge.position.copy(edgeData.localPosition);
                edge.updateMatrix();
            }
        });

        this.originalPositions.clear();
        this.originalEdgePositions.clear();
        this.meshToEdgeMap.clear();
        this.explodeValue = 0.0;
        this.viewer.Render();
    }

    CreatePanel() {
        this.panel = AddDiv(document.body, 'ov_explode_panel');

        // Add label
        let label = AddDiv(this.panel, null);
        label.innerHTML = Loc('Explode View');
        label.style.display = 'inline-block';
        label.style.marginRight = '10px';
        label.style.fontWeight = 'bold';

        // Add slider
        this.slider = AddDomElement(this.panel, 'input', 'ov_explode_slider');
        this.slider.setAttribute('type', 'range');
        this.slider.setAttribute('min', '0');
        this.slider.setAttribute('max', '100');
        this.slider.setAttribute('value', '0');
        this.slider.style.verticalAlign = 'middle';

        // Add value display
        let valueDisplay = AddDiv(this.panel, null);
        valueDisplay.innerHTML = '0%';
        valueDisplay.style.display = 'inline-block';
        valueDisplay.style.marginLeft = '10px';
        valueDisplay.style.minWidth = '40px';

        this.slider.addEventListener('input', (ev) => {
            let value = parseInt(ev.target.value, 10) / 100.0;
            this.SetExplodeValue(value);
            valueDisplay.innerHTML = parseInt(ev.target.value, 10) + '%';
        });

        this.UpdatePanelStyle();
    }

    UpdatePanelStyle() {
        if (!this.panel) {
            return;
        }

        if (this.settings.backgroundIsEnvMap) {
            this.panel.style.color = '#ffffff';
            this.panel.style.backgroundColor = 'rgba(0,0,0,0.7)';
        } else {
            this.panel.style.color = 'var(--ov_foreground_color)';
            this.panel.style.backgroundColor = 'var(--ov_background_color)';
        }
    }

    Resize() {
        if (!this.isActive || !this.panel) {
            return;
        }

        let canvas = this.viewer.GetCanvas();
        let canvasRect = canvas.getBoundingClientRect();
        let panelRect = this.panel.getBoundingClientRect();
        let canvasWidth = canvasRect.right - canvasRect.left;
        let panelWidth = panelRect.right - panelRect.left;

        // Center horizontally at the bottom of the canvas
        this.panel.style.left = (canvasRect.left + (canvasWidth - panelWidth) / 2) + 'px';
        this.panel.style.bottom = '20px';
    }
}

