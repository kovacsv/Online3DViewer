import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

import * as THREE from 'three';

export default function suite ()
{

// A viewer without a WebGL renderer, everything but drawing works.
function CreateViewer ()
{
    let viewer = new OV.Viewer ();
    viewer.scene = new THREE.Scene ();
    viewer.mainModel = new OV.ViewerMainModel (viewer.scene);
    viewer.extraModel = new OV.ViewerModel (viewer.scene);
    viewer.surfaceStrainModel = new OV.ViewerModel (viewer.scene);
    viewer.edgeHighlightModel = new OV.ViewerModel (viewer.scene);
    viewer.shadingModel = new OV.ShadingModel (viewer.scene);
    viewer.Render = () => {};
    return viewer;
}

function MeshUserData (key)
{
    return {
        originalMeshInstance : { id : { GetKey () { return key; } } },
        threeMaterials : null
    };
}

// Meshes with array materials and the userData the model converter creates.
function CreateMainObject (materialsOfMeshes)
{
    let root = new THREE.Object3D ();
    materialsOfMeshes.forEach ((materials, index) => {
        let mesh = new THREE.Mesh (new THREE.BoxGeometry (1, 1, 1), materials);
        mesh.userData = MeshUserData ('mesh' + index.toString ());
        root.add (mesh);
    });
    return root;
}

function CreateSurfaceStrainMapping ()
{
    let meshResult = new OV.SurfaceStrainMeshResult ({ GetKey () { return 'mesh0'; } });
    meshResult.positions = new Float32Array ([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    meshResult.normals = new Float32Array ([0, 0, 1, 0, 0, 1, 0, 0, 1]);
    meshResult.indices = new Uint32Array ([0, 1, 2]);
    meshResult.log10Strain = new Float32Array ([-7, -6, -5]);
    let mapping = new OV.SurfaceStrainMapping ();
    mapping.meshes.push (meshResult);
    return mapping;
}

function CreateBoxModel ()
{
    let model = new OV.Model ();
    model.SetUnit (OV.Unit.Millimeter);
    let mesh = OV.GenerateCuboid (null, 100.0, 20.0, 10.0);
    let meshIndex = model.AddMesh (mesh);
    model.GetRootNode ().AddMeshIndex (meshIndex);
    return model;
}

function PrepareEdges ()
{
    let prepared = OV.PrepareEdgeHighlights (CreateBoxModel (), [{ polyline : [[0, 0, 0], [100, 0, 0]], color : '#ff0000' }]);
    assert.ok (prepared.result.ok, prepared.result.reason);
    return prepared.prepared;
}

function MaterialState (material)
{
    return {
        transparent : material.transparent,
        opacity : material.opacity,
        depthWrite : material.depthWrite
    };
}

function AssertFaded (material, opacity)
{
    assert.deepStrictEqual (MaterialState (material), { transparent : true, opacity : opacity, depthWrite : false });
}

function MainMaterials (viewer)
{
    let materials = [];
    viewer.mainModel.EnumerateMeshes ((mesh) => {
        materials.push (...mesh.material);
    });
    return materials;
}

function StrainMaterials (viewer)
{
    let materials = [];
    viewer.surfaceStrainModel.Traverse ((obj) => {
        if (obj.isMesh) {
            materials.push (obj.material);
        }
    });
    return materials;
}

function EdgeLines (viewer)
{
    let lines = [];
    viewer.edgeHighlightModel.Traverse ((obj) => {
        if (obj.material !== undefined) {
            lines.push (obj);
        }
    });
    return lines;
}

describe ('Model Opacity', function () {
    it ('Fades the main meshes', function () {
        let viewer = CreateViewer ();
        viewer.SetMainObject (CreateMainObject ([[new THREE.MeshPhongMaterial ()], [new THREE.MeshPhongMaterial ()]]));
        let material = MainMaterials (viewer)[0];
        let version = material.version;
        assert.ok (viewer.SetModelOpacity (0.2));
        for (let material of MainMaterials (viewer)) {
            AssertFaded (material, 0.2);
        }
        // The shader changes with transparent.
        assert.ok (material.version > version);
    });

    it ('Restores a model\'s own transparent material exactly', function () {
        let viewer = CreateViewer ();
        let own = new THREE.MeshPhongMaterial ({ transparent : true, opacity : 0.5, depthWrite : true });
        let solid = new THREE.MeshPhongMaterial ();
        viewer.SetMainObject (CreateMainObject ([[own, solid]]));
        assert.ok (viewer.SetModelOpacity (0.2));
        AssertFaded (own, 0.1);
        assert.ok (viewer.SetModelOpacity (0.4));
        AssertFaded (own, 0.2);
        assert.ok (viewer.SetModelOpacity (1));
        assert.deepStrictEqual (MaterialState (own), { transparent : true, opacity : 0.5, depthWrite : true });
        assert.deepStrictEqual (MaterialState (solid), { transparent : false, opacity : 1, depthWrite : true });
    });

    it ('Fades a shared material once', function () {
        let viewer = CreateViewer ();
        let shared = new THREE.MeshPhongMaterial ();
        viewer.SetMainObject (CreateMainObject ([[shared], [shared], [shared]]));
        assert.ok (viewer.SetModelOpacity (0.2));
        AssertFaded (shared, 0.2);
        // Applying again, as every overlay change does, keeps it.
        viewer.SetEdgeHighlights (PrepareEdges ());
        AssertFaded (shared, 0.2);
    });

    it ('Applies an opacity set before the model loads', function () {
        let viewer = CreateViewer ();
        assert.ok (viewer.SetModelOpacity (0.2));
        viewer.SetMainObject (CreateMainObject ([[new THREE.MeshPhongMaterial ()]]));
        AssertFaded (MainMaterials (viewer)[0], 0.2);
        // Clear keeps the setting for the next model.
        viewer.Clear ();
        viewer.SetMainObject (CreateMainObject ([[new THREE.MeshPhongMaterial ()]]));
        AssertFaded (MainMaterials (viewer)[0], 0.2);
        assert.strictEqual (viewer.GetModelOpacity (), 0.2);
    });

    it ('Fades a surface strain shown or recolored while faded', function () {
        let viewer = CreateViewer ();
        viewer.SetMainObject (CreateMainObject ([[new THREE.MeshPhongMaterial ()]]));
        assert.ok (viewer.SetModelOpacity (0.2));
        viewer.SetSurfaceStrain (CreateSurfaceStrainMapping (), new OV.SurfaceStrainColorScale (-8, -4));
        AssertFaded (StrainMaterials (viewer)[0], 0.2);
        viewer.SetSurfaceStrainColorScale (new OV.SurfaceStrainColorScale (-9, -3));
        AssertFaded (StrainMaterials (viewer)[0], 0.2);
        assert.ok (viewer.SetModelOpacity (1));
        assert.deepStrictEqual (MaterialState (StrainMaterials (viewer)[0]), { transparent : false, opacity : 1, depthWrite : true });
    });

    it ('Draws edge highlights after the faded meshes', function () {
        let viewer = CreateViewer ();
        viewer.SetMainObject (CreateMainObject ([[new THREE.MeshPhongMaterial ()]]));
        viewer.SetEdgeHighlights (PrepareEdges ());
        let lines = EdgeLines (viewer);
        assert.ok (lines.length > 0);
        for (let line of lines) {
            assert.strictEqual (line.renderOrder, 0);
            assert.strictEqual (line.material.transparent, false);
        }

        assert.ok (viewer.SetModelOpacity (0.2));
        for (let line of EdgeLines (viewer)) {
            assert.strictEqual (line.renderOrder, 1);
            assert.strictEqual (line.material.transparent, true);
        }
        // New edges shown while faded.
        viewer.SetEdgeHighlights (PrepareEdges ());
        for (let line of EdgeLines (viewer)) {
            assert.strictEqual (line.renderOrder, 1);
            assert.strictEqual (line.material.transparent, true);
        }

        assert.ok (viewer.SetModelOpacity (1));
        for (let line of EdgeLines (viewer)) {
            assert.strictEqual (line.renderOrder, 0);
            assert.strictEqual (line.material.transparent, false);
        }
    });

    it ('Fades highlighted meshes, and un-highlighting leaves them faded once', function () {
        let viewer = CreateViewer ();
        let own = new THREE.MeshPhongMaterial ();
        viewer.SetMainObject (CreateMainObject ([[own]]));
        assert.ok (viewer.SetModelOpacity (0.2));
        viewer.SetMeshesHighlight (new OV.RGBColor (142, 201, 240), () => true);
        let highlight = MainMaterials (viewer)[0];
        assert.notStrictEqual (highlight, own);
        AssertFaded (highlight, 0.2);
        AssertFaded (own, 0.2);

        // The opacity changes while highlighted, the mesh's own materials follow.
        assert.ok (viewer.SetModelOpacity (0.5));
        AssertFaded (highlight, 0.5);
        AssertFaded (own, 0.5);

        viewer.SetMeshesHighlight (new OV.RGBColor (142, 201, 240), () => false);
        assert.strictEqual (MainMaterials (viewer)[0], own);
        AssertFaded (own, 0.5);

        assert.ok (viewer.SetModelOpacity (1));
        assert.deepStrictEqual (MaterialState (own), { transparent : false, opacity : 1, depthWrite : true });
    });

    it ('Refuses out of range values and changes nothing', function () {
        let viewer = CreateViewer ();
        viewer.SetMainObject (CreateMainObject ([[new THREE.MeshPhongMaterial ()]]));
        assert.ok (viewer.SetModelOpacity (0.3));
        let overlays = new OV.ViewerOverlays (viewer);
        for (let value of [0, -1, 1.5, NaN, Infinity, '0.5', null, undefined]) {
            let result = overlays.SetModelOpacity (value);
            assert.strictEqual (result.ok, false);
            assert.strictEqual (result.reason, 'opacity must be a number in (0, 1]');
            assert.strictEqual (viewer.GetModelOpacity (), 0.3);
            AssertFaded (MainMaterials (viewer)[0], 0.3);
        }
        assert.deepStrictEqual (overlays.SetModelOpacity (1), { ok : true, reason : null });
        assert.strictEqual (viewer.GetModelOpacity (), 1);
    });
});

}
