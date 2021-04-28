
OV.FaceSelector = class
{
    static get NoneSelected() 
    { 
        return 0;
    }
    static get OneFaceSelected()
    {
        return 1;
    } 
    static get TwoFaceSelected()
    {
        return 2;
    }

    constructor (viewer, button, infoPanel)
    {
        this.viewer = viewer;
        this.raycaster = new THREE.Raycaster ();
        this.mousePos = new THREE.Vector2 ();
        this.state = OV.FaceSelector.NoneSelected;

        let planeGeometry = new THREE.PlaneGeometry (10, 10);
        let circleGeometry = new THREE.CircleGeometry (3, 32);
        this.selectedPlanes = [
            new THREE.Plane (new THREE.Vector3 (1, 0, 0), 0),
            new THREE.Plane (new THREE.Vector3 (1, 0, 0), 0),
        ];

		this.material = [ 
            new THREE.MeshBasicMaterial ( { color: 0xffff00, transparent: true,  opacity: 0.3, side: THREE.DoubleSide } ), 
            new THREE.MeshBasicMaterial ( { color: 0xff0000, transparent: true,  opacity: 0.8, side: THREE.DoubleSide } )
        ];

		this.mesh = [
            new THREE.Mesh (planeGeometry, this.material[0]),
            new THREE.Mesh (circleGeometry, this.material[1]),
            new THREE.Mesh (circleGeometry, this.material[1])
        ];

        for (let m = 0; m < this.mesh.length; m++) {
            let mesh = this.mesh[m];
            mesh.visible = false;
		    this.viewer.scene.add (mesh);
        }
        this.viewer.Render();
        this.viewer.navigation.SetMoveHandler(this.GetFaceUnderMouse.bind (this));
        this.viewer.navigation.SetClickHandler(this.SelectFace.bind (this));
        this.button = button;
        this.infoPanel = infoPanel;
    }

    IntersectPlane(mouseCoords)
    {
        this.mousePos.x = (mouseCoords.x / this.viewer.canvas.width) * 2 - 1;
        this.mousePos.y = -(mouseCoords.y / this.viewer.canvas.height) * 2 + 1;
        this.raycaster.setFromCamera (this.mousePos, this.viewer.camera);
        let iSectObjects = this.raycaster.intersectObjects (this.viewer.scene.children);
        this.mesh[0].visible = false;
        if (iSectObjects.length > 0) {
            // Don't intersect with our own planes
            for (let i = 0; i < iSectObjects.length; i++) {
                let obj = iSectObjects[i];
                if (obj.object.id === this.mesh[0].id || obj.object.id === this.mesh[1].id || obj.object.id === this.mesh[2].id) {
                    continue;
                }
                if (obj.object.type === 'Mesh' && obj.object.visible) {
                    return { normal : obj.face.normal, position : obj.point };
                }
            }
        }
        return null;
    }

    GetFaceUnderMouse (mouseCoords)
    {
        let plane = this.IntersectPlane(mouseCoords);

        if (plane !== null) {
            this.mesh[0].position.copy (plane.position.addScaledVector (plane.normal, 0.005));
            this.mesh[0].quaternion.setFromUnitVectors (new THREE.Vector3 (0, 0, 1), plane.normal);

            this.mesh[0].visible = true;
            this.viewer.Render();
            return true;
        }
        return false;
    }

    SelectFace (button, isCtrlPressed, mouseCoords)
    {
        // Handle HiDPI display
        let dpr = window.devicePixelRatio || 1;
		mouseCoords.x *= dpr; mouseCoords.y *= dpr;

        let plane = this.IntersectPlane(mouseCoords);
        if (plane === null) {
            return false;
        }

        switch (this.state) {
            case OV.FaceSelector.TwoFaceSelected:
                this.mesh[2].visible = false;
                /* falls through */ 
            case OV.FaceSelector.NoneSelected:
                this.selectedPlanes[0].setFromNormalAndCoplanarPoint (plane.normal, plane.position);
                this.mesh[1].position.copy (plane.position.addScaledVector (plane.normal, 0.01));
                this.mesh[1].quaternion.setFromUnitVectors (new THREE.Vector3 (0, 0, 1), plane.normal);

                this.state = OV.FaceSelector.OneFaceSelected;
                this.mesh[1].visible = true;
                break;
            case OV.FaceSelector.OneFaceSelected:
                this.selectedPlanes[1].setFromNormalAndCoplanarPoint (plane.normal, plane.position);
                this.mesh[2].position.copy (plane.position.addScaledVector (plane.normal, 0.01));
                this.mesh[2].quaternion.setFromUnitVectors (new THREE.Vector3 (0, 0, 1), plane.normal);

                this.state = OV.FaceSelector.TwoFaceSelected;
                this.mesh[2].visible = true;

                let angle = this.selectedPlanes[0].normal.angleTo (this.selectedPlanes[1].normal);
                let pointOnFirstPlane = new THREE.Vector3 (0, 0, 0);
                this.selectedPlanes[0].coplanarPoint (pointOnFirstPlane);
                let distance = Math.abs(this.selectedPlanes[1].distanceToPoint (pointOnFirstPlane));
                let hypDistance = this.mesh[1].position.clone().addScaledVector (this.selectedPlanes[0].normal, -0.01).distanceTo (
                    this.mesh[2].position.clone().addScaledVector (this.selectedPlanes[0].normal, -0.01)
                );
                // Check if the 2 planes are intersecting (in that case, the distance must be zeroed)
                if (Math.abs (angle % Math.PI) > 0.01) {
                    distance = 0;
                }
                this.infoPanel.UpdateMeasure (distance, angle, hypDistance);
                break;
        }
        this.viewer.Render();
    }

    Dispose ()
    {
        this.viewer.navigation.SetMoveHandler (null);
        for (let m = 0; m < this.mesh.length; m++) {
            let mesh = this.mesh[m];
            mesh.visible = false;
		    this.viewer.scene.remove (mesh);
        }
        this.button.Select (false);
        this.infoPanel.UpdateMeasure (null, null);
        this.viewer.Render ();
    }
};