
OV.FaceSelector = class
{
    static NoneSelected = 0;
    static OneFaceSelected = 1;
    static TwoFaceSelected = 2;

    constructor (viewer)
    {
        this.viewer = viewer;
        this.raycaster = new THREE.Raycaster ();
        this.mousePos = new THREE.Vector2 ();
        this.state = OV.FaceSelector.NoneSelected;

        this.geometry = new THREE.PlaneGeometry (1, 1);
		this.geometry.setAttribute ( 'position', new THREE.BufferAttribute (new Float32Array ( 4 * 3 ), 3 ) );

		this.material = new THREE.MeshBasicMaterial ( { color: 0x00ff00, transparent: false, side: THREE.DoubleSide } );

		this.mesh = new THREE.Mesh (this.geometry, this.material);
		this.viewer.scene.add (this.mesh);
        this.viewer.navigation.SetMoveHandler(this.GetFaceUnderMouse.bind (this));
    }

    GetFaceUnderMouse (mouseCoords)
    {
        this.mousePos.x = (mouseCoords.x / this.viewer.canvas.width) * 2 - 1;
        this.mousePos.y = -(mouseCoords.y / this.viewer.canvas.height) * 2 + 1;
        this.raycaster.setFromCamera (this.mousePos, this.viewer.camera);
        let iSectObjects = this.raycaster.intersectObjects (this.viewer.scene.children);
        this.mesh.visible = false;
        if (iSectObjects.length > 0) {
            let iSectObject = iSectObjects[0];
            if (iSectObject.object.type === 'Mesh' && iSectObject.object.visible) {
                let iSectFace = iSectObject.face;
                iSectObject.object.material.color = 0xFF0000;
                const position = this.mesh.geometry.attributes.position;
				const meshPosition = iSectObject.object.geometry.attributes.position;

				position.copyAt( 0, meshPosition, iSectFace.a );
				position.copyAt( 1, meshPosition, iSectFace.b );
				position.copyAt( 2, meshPosition, iSectFace.c );
				position.copyAt( 3, meshPosition, iSectFace.a );

				iSectObject.object.updateMatrix();

				this.mesh.geometry.applyMatrix4( iSectObject.object.matrix );

				this.mesh.visible = true;
                this.viewer.Render();
                return true;
            }
        }
        return false;
    }

    Dispose ()
    {
        this.viewer.navigation.SetMoveHandler(null);
        this.viewer.scene.remove (this.line);
    }
};