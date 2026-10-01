import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import * as THREE from 'three';

export default function suite ()
{

function CreateTestScene ()
{
    let root = new THREE.Object3D ();
    let sphere = new THREE.Mesh (new THREE.SphereGeometry (1.0, 32, 16), new THREE.MeshBasicMaterial ());
    sphere.position.set (-1.5, 0.0, 0.0);
    sphere.name = 'sphere';
    root.add (sphere);
    let box = new THREE.Mesh (new THREE.BoxGeometry (1.0, 1.0, 1.0).toNonIndexed (), new THREE.MeshBasicMaterial ());
    box.position.set (1.5, 0.0, 0.0);
    box.name = 'box';
    root.add (box);
    root.updateWorldMatrix (true, true);
    return root;
}

function CastRays (root, raycaster = new THREE.Raycaster ())
{
    let results = [];
    for (let i = 0; i < 64; i++) {
        let target = new THREE.Vector3 (-3.0 + 6.0 * (i % 8) / 7.0, -1.0 + 2.0 * Math.floor (i / 8) / 7.0, 0.0);
        let origin = new THREE.Vector3 (target.x * 0.5, target.y * 0.5, 10.0);
        raycaster.set (origin, target.sub (origin).normalize ());
        let hits = raycaster.intersectObject (root, true);
        results.push (hits.length === 0 ? null : hits[0]);
    }
    return results;
}

function AssertSameHits (expected, actual)
{
    assert.strictEqual (actual.length, expected.length);
    let hitCount = 0;
    for (let i = 0; i < expected.length; i++) {
        if (expected[i] === null) {
            assert.strictEqual (actual[i], null);
            continue;
        }
        hitCount += 1;
        assert.strictEqual (actual[i].object.name, expected[i].object.name);
        assert.strictEqual (actual[i].faceIndex, expected[i].faceIndex);
        assert.ok (actual[i].point.distanceTo (expected[i].point) < 1e-6);
        assert.ok (Math.abs (actual[i].distance - expected[i].distance) < 1e-6);
    }
    assert.ok (hitCount > 0);
}

function GetMeshes (root)
{
    let meshes = [];
    root.traverse ((obj) => {
        if (obj.isMesh) {
            meshes.push (obj);
        }
    });
    return meshes;
}

function CreateCamera ()
{
    let camera = new THREE.PerspectiveCamera (45.0, 1.0, 0.1, 100.0);
    camera.position.set (0.0, 0.0, 10.0);
    camera.lookAt (0.0, 0.0, 0.0);
    camera.updateMatrixWorld ();
    return camera;
}

describe ('BVH Picking', function () {
    it ('Same hits as plain raycast', function () {
        let root = CreateTestScene ();
        let expected = CastRays (root);
        root.traverse ((obj) => {
            OV.BuildThreeMeshBoundsTree (obj);
        });
        root.traverse ((obj) => {
            if (obj.isMesh) {
                assert.ok (obj.geometry.boundsTree);
            }
        });
        AssertSameHits (expected, CastRays (root));
    });

    it ('Same hits after rigid transform without rebuild', function () {
        let root = CreateTestScene ();
        root.traverse ((obj) => {
            OV.BuildThreeMeshBoundsTree (obj);
        });
        let plainRoot = CreateTestScene ();
        for (let r of [root, plainRoot]) {
            r.rotation.set (0.3, 0.5, 0.1);
            r.scale.set (1.2, 1.2, 1.2);
            r.position.set (0.2, -0.1, 0.0);
            r.updateWorldMatrix (true, true);
        }
        AssertSameHits (CastRays (plainRoot), CastRays (root));
    });

    it ('Dispose removes bounds tree', function () {
        let root = CreateTestScene ();
        root.traverse ((obj) => {
            OV.BuildThreeMeshBoundsTree (obj);
        });
        let meshes = [];
        root.traverse ((obj) => {
            if (obj.isMesh) {
                meshes.push (obj);
            }
        });
        let geometries = meshes.map ((mesh) => mesh.geometry);
        OV.DisposeThreeObjects (root);
        for (let geometry of geometries) {
            assert.ok (!geometry.boundsTree);
        }
    });

    it ('Bounds trees are built on the first pick', function () {
        let mainModel = new OV.ViewerMainModel (new THREE.Scene ());
        let root = CreateTestScene ();
        root.position.set (-1.5, 0.0, 0.0);
        root.updateWorldMatrix (true, true);
        mainModel.SetMainObject (root);
        for (let mesh of GetMeshes (root)) {
            assert.ok (!mesh.geometry.boundsTree);
        }
        let intersection = mainModel.GetMeshIntersectionUnderMouse (OV.IntersectionMode.MeshOnly, { x : 50, y : 50 }, CreateCamera (), 100, 100);
        assert.strictEqual (intersection.object.name, 'box');
        for (let mesh of GetMeshes (root)) {
            assert.ok (mesh.geometry.boundsTree);
        }
    });

    it ('Pick skips a hidden mesh in front', function () {
        let mainModel = new OV.ViewerMainModel (new THREE.Scene ());
        let root = CreateTestScene ();
        let sphere = root.getObjectByName ('sphere');
        let box = root.getObjectByName ('box');
        sphere.position.set (0.0, 0.0, 2.0);
        box.position.set (0.0, 0.0, 0.0);
        root.updateWorldMatrix (true, true);
        mainModel.SetMainObject (root);
        let camera = CreateCamera ();
        // Off center, so the ray does not go exactly through a vertex.
        let mouseCoords = { x : 51, y : 48 };
        assert.strictEqual (mainModel.GetMeshIntersectionUnderMouse (OV.IntersectionMode.MeshOnly, mouseCoords, camera, 100, 100).object.name, 'sphere');
        sphere.visible = false;
        assert.strictEqual (mainModel.GetMeshIntersectionUnderMouse (OV.IntersectionMode.MeshOnly, mouseCoords, camera, 100, 100).object.name, 'box');
    });

    it ('Same material index on converted mesh with two materials', function (done) {
        let model = new OV.Model ();
        model.AddMaterial (new OV.PhongMaterial ());
        model.AddMaterial (new OV.PhongMaterial ());
        let sphere = OV.GenerateSphere (null, 1.0, 24, false);
        for (let i = 0; i < sphere.TriangleCount (); i++) {
            sphere.GetTriangle (i).mat = (i % 3 === 0) ? 0 : 1;
        }
        model.AddMeshToRootNode (sphere);
        OV.FinalizeModel (model);
        OV.ConvertModelToThreeObject (model, new OV.ModelToThreeConversionParams (), new OV.ModelToThreeConversionOutput (), {
            onTextureLoaded : () => {},
            onModelLoaded : (threeObject) => {
                threeObject.updateWorldMatrix (true, true);
                let mesh = GetMeshes (threeObject)[0];
                assert.ok (mesh.geometry.groups.length > 1);
                let expected = CastRays (threeObject);
                OV.BuildThreeMeshBoundsTree (mesh);
                let raycaster = new THREE.Raycaster ();
                raycaster.firstHitOnly = true;
                let actual = CastRays (threeObject, raycaster);
                AssertSameHits (expected, actual);
                for (let i = 0; i < expected.length; i++) {
                    if (expected[i] !== null) {
                        assert.strictEqual (actual[i].face.materialIndex, expected[i].face.materialIndex);
                    }
                }
                done ();
            }
        });
    });
});

}
