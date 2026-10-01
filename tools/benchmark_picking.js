/* eslint-env node */
// Compares plain three.js raycast with the BVH-accelerated one used by the viewer.
// The mesh goes through ConvertModelToThreeObject, so it is non-indexed with material groups like in the viewer.
// Usage: node tools/benchmark_picking.js [rayCount] [segments]

import * as os from 'os';
import { performance } from 'perf_hooks';
import * as THREE from 'three';
import { estimateMemoryInBytes } from 'three-mesh-bvh';
import * as OV from '../source/engine/main.js';

const rayCount = parseInt (process.argv[2] || '1000', 10);
const segments = parseInt (process.argv[3] || '512', 10);
const seed = 42;

function CreateRandom (seed)
{
    // mulberry32, so every run casts the same rays.
    let state = seed >>> 0;
    return function () {
        state = (state + 0x6D2B79F5) >>> 0;
        let t = state;
        t = Math.imul (t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul (t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function RandomPointInSphere (random, radius)
{
    let point = new THREE.Vector3 ();
    do {
        point.set (random () * 2.0 - 1.0, random () * 2.0 - 1.0, random () * 2.0 - 1.0);
    } while (point.lengthSq () > 1.0);
    return point.multiplyScalar (radius);
}

function CreateNoisySphere (random, onReady)
{
    let model = new OV.Model ();
    model.AddMaterial (new OV.PhongMaterial ());
    model.AddMaterial (new OV.PhongMaterial ());
    let sphere = OV.GenerateSphere (null, 1.0, segments, false);
    for (let i = 0; i < sphere.VertexCount (); i++) {
        sphere.GetVertex (i).MultiplyScalar (1.0 + (random () - 0.5) * 0.02);
    }
    for (let i = 0; i < sphere.TriangleCount (); i++) {
        sphere.GetTriangle (i).mat = (i % 3 === 0) ? 0 : 1;
    }
    model.AddMeshToRootNode (sphere);
    OV.FinalizeModel (model);
    OV.ConvertModelToThreeObject (model, new OV.ModelToThreeConversionParams (), new OV.ModelToThreeConversionOutput (), {
        onTextureLoaded : () => {},
        onModelLoaded : (threeObject) => {
            threeObject.rotation.set (0.3, 0.7, 0.0);
            threeObject.updateWorldMatrix (true, true);
            let mesh = null;
            threeObject.traverse ((obj) => {
                if (obj.isMesh) {
                    mesh = obj;
                }
            });
            onReady (mesh);
        }
    });
}

function CreateRays (random)
{
    let rays = [];
    for (let i = 0; i < rayCount; i++) {
        let origin = RandomPointInSphere (random, 1.0).normalize ().multiplyScalar (3.0);
        let target = RandomPointInSphere (random, 1.2);
        rays.push (new THREE.Ray (origin, target.sub (origin).normalize ()));
    }
    return rays;
}

function CastRays (mesh, rays, firstHitOnly)
{
    let raycaster = new THREE.Raycaster ();
    raycaster.firstHitOnly = firstHitOnly;
    let results = [];
    let start = performance.now ();
    for (let ray of rays) {
        raycaster.ray.copy (ray);
        let hits = raycaster.intersectObject (mesh, false);
        results.push (hits.length === 0 ? null : hits[0]);
    }
    let elapsed = performance.now () - start;
    return { results, elapsed };
}

function CountMismatches (expected, actual)
{
    let mismatches = 0;
    for (let i = 0; i < expected.length; i++) {
        let e = expected[i];
        let a = actual[i];
        if (e === null || a === null) {
            mismatches += (e === a) ? 0 : 1;
        } else if (e.object !== a.object || e.faceIndex !== a.faceIndex || e.face.materialIndex !== a.face.materialIndex || e.point.distanceTo (a.point) > 1e-6) {
            mismatches += 1;
        }
    }
    return mismatches;
}

function FormatMegabytes (bytes)
{
    return (bytes / 1024 / 1024).toFixed (1) + ' MB';
}

function RunBenchmark (mesh, rays)
{
    let geometry = mesh.geometry;
    let triangleCount = geometry.getAttribute ('position').count / 3;

    // Warm up the JIT on the plain path so it is not penalized for running first.
    CastRays (mesh, rays.slice (0, 20), false);
    let plain = CastRays (mesh, rays, false);

    let buildStart = performance.now ();
    OV.BuildThreeMeshBoundsTree (mesh);
    let buildTime = performance.now () - buildStart;

    let bvh = CastRays (mesh, rays, false);
    let bvhFirst = CastRays (mesh, rays, true);

    let hitCount = plain.results.filter ((hit) => hit !== null).length;
    let plainPerRay = plain.elapsed / rayCount;
    let bvhPerRay = bvh.elapsed / rayCount;
    let geometryBytes = 0;
    for (let attribute of Object.values (geometry.attributes)) {
        geometryBytes += attribute.array.byteLength;
    }
    // The estimate walks the tree object, which references the geometry too.
    let bvhBytes = estimateMemoryInBytes (geometry.boundsTree) - geometryBytes;

    console.log ('Machine:   ' + os.cpus ()[0].model + ', ' + os.cpus ().length + ' cores, node ' + process.version);
    console.log ('Mesh:      ' + triangleCount + ' triangles, non-indexed, ' + geometry.groups.length + ' material groups');
    console.log ('Rays:      ' + rayCount + ' (' + hitCount + ' hit), seed ' + seed);
    console.log ('');
    console.table ({
        'plain raycast' : { 'ms / ray' : plainPerRay.toFixed (4), 'total ms' : plain.elapsed.toFixed (1), 'mismatches' : '-' },
        'BVH raycast' : { 'ms / ray' : bvhPerRay.toFixed (4), 'total ms' : bvh.elapsed.toFixed (1), 'mismatches' : CountMismatches (plain.results, bvh.results) },
        'BVH firstHitOnly' : { 'ms / ray' : (bvhFirst.elapsed / rayCount).toFixed (4), 'total ms' : bvhFirst.elapsed.toFixed (1), 'mismatches' : CountMismatches (plain.results, bvhFirst.results) },
        'BVH build (once)' : { 'ms / ray' : '-', 'total ms' : buildTime.toFixed (1), 'mismatches' : '-' }
    });
    console.log ('Memory:     BVH ~' + FormatMegabytes (bvhBytes) + ', geometry attributes ' + FormatMegabytes (geometryBytes));
    console.log ('Speedup:    ' + (plainPerRay / bvhPerRay).toFixed (0) + 'x per ray');
    if (bvhPerRay < plainPerRay) {
        console.log ('Break-even: ' + Math.ceil (buildTime / (plainPerRay - bvhPerRay)) + ' rays');
    } else {
        console.log ('Break-even: never, BVH is not faster per ray');
    }
}

let random = CreateRandom (seed);
CreateNoisySphere (random, (mesh) => {
    RunBenchmark (mesh, CreateRays (random));
});
