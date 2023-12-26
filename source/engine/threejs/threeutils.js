import { Coord2D } from '../geometry/coord2d.js';
import { Coord3D } from '../geometry/coord3d.js';
import { Segment2D, SegmentPointDistance2D } from '../geometry/line2d.js';
import { RGBColorFromFloatComponents } from '../model/color.js';
import { MaterialType } from '../model/material.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';

import * as THREE from 'three';

// Some mobile devices say that they support mediump, but in reality they don't. At the end
// all materials rendered as black. This hack renders a single plane with red material and
// it checks if it's really red. If it's not, then probably there is a driver issue.
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
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
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

export class ThreeColorConverter
{
    Convert (color)
    {
        return null;
    }
}

export class ThreeLinearToSRGBColorConverter extends ThreeColorConverter
{
    Convert (color)
    {
        return new THREE.Color ().copyLinearToSRGB (color);
    }
}

export class ThreeSRGBToLinearColorConverter extends ThreeColorConverter
{
    Convert (color)
    {
        return new THREE.Color ().copySRGBToLinear (color);
    }
}

export function ConvertThreeColorToColor (threeColor)
{
    return RGBColorFromFloatComponents (threeColor.r, threeColor.g, threeColor.b);
}

export function ConvertColorToThreeColor (color)
{
    return new THREE.Color (
        color.r / 255.0,
        color.g / 255.0,
        color.b / 255.0
    );
}

export function ConvertThreeGeometryToMesh (threeGeometry, materialIndex, colorConverter)
{
    let mesh = new Mesh ();

    let vertices = threeGeometry.attributes.position.array;
    let vertexItemSize = threeGeometry.attributes.position.itemSize || 3;
    for (let i = 0; i < vertices.length; i += vertexItemSize) {
        let x = vertices[i];
        let y = vertices[i + 1];
        let z = vertices[i + 2];
        mesh.AddVertex (new Coord3D (x, y, z));
    }

    let hasVertexColors = (threeGeometry.attributes.color !== undefined);
    if (hasVertexColors) {
        let colors = threeGeometry.attributes.color.array;
        let colorItemSize = threeGeometry.attributes.color.itemSize || 3;
        for (let i = 0; i < colors.length; i += colorItemSize) {
            let threeColor = new THREE.Color (colors[i], colors[i + 1], colors[i + 2]);
            if (colorConverter !== null) {
                threeColor = colorConverter.Convert (threeColor);
            }
            mesh.AddVertexColor (ConvertThreeColorToColor (threeColor));
        }
    }

    let hasNormals = (threeGeometry.attributes.normal !== undefined);
    if (hasNormals) {
        let normals = threeGeometry.attributes.normal.array;
        let normalItemSize = threeGeometry.attributes.normal.itemSize || 3;
        for (let i = 0; i < normals.length; i += normalItemSize) {
            let x = normals[i];
            let y = normals[i + 1];
            let z = normals[i + 2];
            mesh.AddNormal (new Coord3D (x, y, z));
        }
    }

    let hasUVs = (threeGeometry.attributes.uv !== undefined);
    if (hasUVs) {
        let uvs = threeGeometry.attributes.uv.array;
        let uvItemSize = threeGeometry.attributes.uv.itemSize || 2;
        for (let i = 0; i < uvs.length; i += uvItemSize) {
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

export function CreateHighlightMaterial (originalMaterial, highlightColor, withPolygonOffset)
{
    let material = null;
    if (originalMaterial.type === 'MeshPhongMaterial') {
        material = new THREE.MeshPhongMaterial ({
            color : ConvertColorToThreeColor (highlightColor),
            side : THREE.DoubleSide
        });
    } else if (originalMaterial.type === 'MeshStandardMaterial') {
        material = new THREE.MeshStandardMaterial ({
            color : ConvertColorToThreeColor (highlightColor),
            side : THREE.DoubleSide
        });
    } else if (originalMaterial.type === 'LineBasicMaterial') {
        material = new THREE.LineBasicMaterial ({
            color : ConvertColorToThreeColor (highlightColor)
        });
    }
    if (material !== null && withPolygonOffset) {
        material.polygonOffset = true;
        material.polygonOffsetUnit = 1;
        material.polygonOffsetFactor = 1;
    }
    return material;
}

export function CreateHighlightMaterials (originalMaterials, highlightColor, withPolygonOffset)
{
    let typeToHighlightMaterial = new Map ();
    let highlightMaterials = [];
    for (let originalMaterial of originalMaterials) {
        if (typeToHighlightMaterial.has (originalMaterial.type)) {
            highlightMaterials.push (typeToHighlightMaterial.get (originalMaterial.type));
            continue;
        }
        let highlightMaterial = CreateHighlightMaterial (originalMaterial, highlightColor, withPolygonOffset);
        typeToHighlightMaterial.set (originalMaterial.type, highlightMaterial);
        highlightMaterials.push (highlightMaterial);
    }
    return highlightMaterials;
}

export function DisposeThreeObjects (mainObject)
{
    if (mainObject === null) {
        return;
    }

    mainObject.traverse ((obj) => {
        if (obj.isMesh || obj.isLineSegments) {
            if (Array.isArray (obj.material)) {
                for (let material of obj.material) {
                    material.dispose ();
                }
            } else {
                obj.material.dispose ();
            }
            obj.userData = null;
            obj.geometry.dispose ();
        }
    });
}

export function GetLineSegmentsProjectedDistance (camera, canvasWidth, canvasHeight, lineSegments, screenPoint)
{
    function GetProjectedVertex (camera, canvasWidth, canvasHeight, lineSegments, vertices, index)
    {
        let vertex = new THREE.Vector3 (
            vertices[3 * index],
            vertices[3 * index + 1],
            vertices[3 * index + 2]
        );
        vertex.applyMatrix4 (lineSegments.matrixWorld);
        let projected = vertex.project (camera);
        return new Coord2D (
            (projected.x + 1.0) * canvasWidth / 2.0,
            -(projected.y - 1.0) * canvasHeight / 2.0
        );
    }

    let vertices = lineSegments.geometry.attributes.position.array;
    let segmentCount = vertices.length / 6;
    let distance = Infinity;
    for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex++) {
        let segment = new Segment2D (
            GetProjectedVertex (camera, canvasWidth, canvasHeight, lineSegments, vertices, 2 * segmentIndex),
            GetProjectedVertex (camera, canvasWidth, canvasHeight, lineSegments, vertices, 2 * segmentIndex + 1)
        );
        distance = Math.min (distance, SegmentPointDistance2D (segment, screenPoint));
    }
    return distance;
}
