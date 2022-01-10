// Some mobile devices say that they support mediump, but in reality they don't. At the end
// all materials rendered as black. This hack renders a single plane with red material and
// it checks if it's really red. If it's not, then probably there is a driver issue.

import { Coord2D } from '../geometry/coord2d.js';
import { Coord3D } from '../geometry/coord3d.js';
import { ColorFromFloatComponents } from '../model/color.js';
import { MaterialType } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';

// https://github.com/kovacsv/Online3DViewer/issues/69
export function HasHighpDriverIssue ()
{
    let canvas = document.createElement ('canvas');
    document.body.appendChild (canvas);
    let parameters = {
        canvas : canvas,
        antialias : true
    };

    let renderer = new THREE.WebGLRenderer (parameters);
    renderer.setClearColor ('#ffffff', 1);
    renderer.setSize (10, 10);

    let scene = new THREE.Scene ();

    let ambientLight = new THREE.AmbientLight (0x888888);
    scene.add (ambientLight);

    let light = new THREE.DirectionalLight (0x888888);
    light.position.set (0.0, 0.0, 1.0);
    scene.add (light);

    let camera = new THREE.PerspectiveCamera (45.0, 1.0, 0.1, 1000.0);
    camera.position.set (0.0, 0.0, 1.0);
    camera.up.set (0.0, 1.0, 0.0);
    camera.lookAt (new THREE.Vector3 (0.0, 0.0, 0.0));
    scene.add (camera);

    let plane = new THREE.PlaneGeometry (1.0, 1.0);
    let mesh = new THREE.Mesh (plane, new THREE.MeshPhongMaterial ({
        color : 0xcc0000
    }));
    scene.add (mesh);
    renderer.render (scene, camera);

    let context = renderer.getContext ();
    let pixels = new Uint8Array (4);
    context.readPixels(
        5, 5, 1, 1,
        context.RGBA,
        context.UNSIGNED_BYTE,
        pixels
    );

    document.body.removeChild (canvas);

    let blackThreshold = 50;
    if (pixels[0] < blackThreshold && pixels[1] < blackThreshold && pixels[2] < blackThreshold) {
        return true;
    }
    return false;
}

export const ShadingType =
{
    Phong : 1,
    Physical : 2
};

export function GetShadingType (model)
{
    let phongCount = 0;
    let physicalCount = 0;
    for (let i = 0; i < model.MaterialCount (); i++) {
        let material = model.GetMaterial (i);
        if (material.type === MaterialType.Phong) {
            phongCount += 1;
        } else if (material.type === MaterialType.Physical) {
            physicalCount += 1;
        }
    }
    if (phongCount >= physicalCount) {
        return ShadingType.Phong;
    } else {
        return ShadingType.Physical;
    }
}

export function ConvertThreeColorToColor (threeColor)
{
    return ColorFromFloatComponents (threeColor.r, threeColor.g, threeColor.b);
}

export function ConvertColorToThreeColor (color)
{
    return new THREE.Color (
        color.r / 255.0,
        color.g / 255.0,
        color.b / 255.0
    );
}

export function ConvertThreeGeometryToMesh (threeGeometry, materialIndex)
{
    let mesh = new Mesh ();

    let vertices = threeGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        let x = vertices[i];
        let y = vertices[i + 1];
        let z = vertices[i + 2];
        mesh.AddVertex (new Coord3D (x, y, z));
    }

    let hasVertexColors = (threeGeometry.attributes.color !== undefined);
    if (hasVertexColors) {
        let colors = threeGeometry.attributes.color.array;
        let itemSize = threeGeometry.attributes.color.itemSize;
        for (let i = 0; i < colors.length; i += itemSize) {
            let threeColor = new THREE.Color (colors[i], colors[i + 1], colors[i + 2]);
            mesh.AddVertexColor (ConvertThreeColorToColor (threeColor));
        }
    }

    let hasNormals = (threeGeometry.attributes.normal !== undefined);
    if (hasNormals) {
        let normals = threeGeometry.attributes.normal.array;
        for (let i = 0; i < normals.length; i += 3) {
            let x = normals[i];
            let y = normals[i + 1];
            let z = normals[i + 2];
            mesh.AddNormal (new Coord3D (x, y, z));
        }
    }

    let hasUVs = (threeGeometry.attributes.uv !== undefined);
    if (hasUVs) {
        let uvs = threeGeometry.attributes.uv.array;
        for (let i = 0; i < uvs.length; i += 2) {
            let x = uvs[i];
            let y = uvs[i + 1];
            mesh.AddTextureUV (new Coord2D (x, y));
        }
    }

    let indices = null;
    if (threeGeometry.index !== null) {
        indices = threeGeometry.index.array;
    } else {
        indices = [];
        for (let i = 0; i < vertices.length / 3; i++) {
            indices.push (i);
        }
    }

    for (let i = 0; i < indices.length; i += 3) {
        let v0 = indices[i];
        let v1 = indices[i + 1];
        let v2 = indices[i + 2];
        let triangle = new Triangle (v0, v1, v2);
        if (hasVertexColors) {
            triangle.SetVertexColors (v0, v1, v2);
        }
        if (hasNormals) {
            triangle.SetNormals (v0, v1, v2);
        }
        if (hasUVs) {
            triangle.SetTextureUVs (v0, v1, v2);
        }
        if (materialIndex !== null) {
            triangle.SetMaterial (materialIndex);
        }
        mesh.AddTriangle (triangle);
    }

    return mesh;
}
