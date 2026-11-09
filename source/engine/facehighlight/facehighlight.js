import { ParseHexColor } from '../surfacestrain/surfacestraincolor.js';
import { CollectFaceGeometry } from '../surfacestrain/surfacestrainsampler.js';

// Whole BREP faces painted in a colour, for example the faces of a part that need too long a tool.
// The host names a face by its index in the model: the BREP faces of every mesh instance in the
// order the model enumerates them, each mesh's faces in the order occt-import-js reports them. A
// face that didn't triangulate keeps its index, it just has nothing to paint. The host can't see
// how the viewer numbered the faces, so it passes the number of faces it knows of, and a model
// with another count is refused: a dropped body or another STEP would paint the wrong faces.

export class FaceHighlight
{
    constructor (faces, color)
    {
        // Indices of the faces to paint.
        this.faces = faces;
        // Hex color like '#ff0000'.
        this.color = color;
    }
}

export class FaceHighlightParams
{
    constructor ()
    {
        // Number of faces the host expects the model to have, null doesn't check it.
        this.expectedFaceCount = null;
    }
}

export class FaceHighlightResult
{
    constructor ()
    {
        this.ok = false;
        this.reason = null;
        // Number of faces painted, over every highlight.
        this.faceCount = 0;
    }
}

/**
 * The painted faces of one mesh instance, in model coordinates.
 */
export class PreparedFaceHighlight
{
    constructor (meshInstanceId)
    {
        this.meshInstanceId = meshInstanceId;
        // Float32Array of x, y, z.
        this.positions = null;
        // Float32Array of unit normals.
        this.normals = null;
        // Float32Array of r, g, b in 0..1 per vertex.
        this.colors = null;
        // Uint32Array, three vertex indices per triangle.
        this.indices = null;
    }

    VertexCount ()
    {
        return this.positions.length / 3;
    }
}

/**
 * Lists the BREP faces of the model in the order the host numbers them.
 * @param {Model} model The viewer's model.
 * @returns {{meshInstance: MeshInstance, first: number, last: number}[]} A face that didn't
 * triangulate has first > last.
 */
export function GetModelFaces (model)
{
    let faces = [];
    model.EnumerateMeshInstances ((meshInstance) => {
        for (let brepFace of meshInstance.GetMesh ().GetBrepFaces ()) {
            faces.push ({ meshInstance : meshInstance, first : brepFace.first, last : brepFace.last });
        }
    });
    return faces;
}

function IsValidFaceCount (count)
{
    return Number.isInteger (count) && count >= 0;
}

function ParseHighlight (highlight, modelFaces, faceColors)
{
    if (highlight === null || typeof highlight !== 'object') {
        throw new Error ('must be an object with faces and color');
    }
    let color = ParseHexColor (highlight.color, 'color');
    if (!Array.isArray (highlight.faces)) {
        throw new Error ('faces must be a list of face indices');
    }
    for (let face of highlight.faces) {
        if (!Number.isInteger (face) || face < 0 || face >= modelFaces.length) {
            throw new Error ('face ' + JSON.stringify (face) + ' is not an index of the model\'s ' + modelFaces.length.toString () + ' faces');
        }
        if (faceColors.has (face)) {
            throw new Error ('face ' + face.toString () + ' is in more than one highlight');
        }
        faceColors.set (face, color);
    }
}

function PrepareMeshInstance (meshInstance, faces)
{
    let mesh = meshInstance.GetMesh ();
    let transformation = meshInstance.GetTransformation ();
    let positions = [];
    let normals = [];
    let colors = [];
    let indices = [];
    for (let face of faces) {
        if (face.first > face.last || face.last >= mesh.TriangleCount ()) {
            continue;
        }
        let geometry = CollectFaceGeometry (mesh, transformation, face.first, face.last);
        let offset = positions.length / 3;
        for (let i = 0; i < geometry.positions.length; i++) {
            positions.push (geometry.positions[i]);
            normals.push (geometry.normals[i]);
            colors.push (face.color[i % 3]);
        }
        for (let vertexIndex of geometry.triangles) {
            indices.push (vertexIndex + offset);
        }
    }
    if (indices.length === 0) {
        return null;
    }
    let prepared = new PreparedFaceHighlight (meshInstance.GetId ());
    prepared.positions = new Float32Array (positions);
    prepared.normals = new Float32Array (normals);
    prepared.colors = new Float32Array (colors);
    prepared.indices = new Uint32Array (indices);
    return prepared;
}

/**
 * Validates the highlights against the model's faces and collects the triangles to paint. Either
 * every highlight is prepared or none.
 * @param {Model} model The viewer's model.
 * @param {FaceHighlight[]} highlights Faces to paint, a face may be in one highlight only.
 * @param {FaceHighlightParams} [params] Parameters.
 * @returns {{result: FaceHighlightResult, prepared: PreparedFaceHighlight[]|null}} On failure
 * result.ok is false, result.reason says why, and nothing must be shown.
 */
export function PrepareFaceHighlights (model, highlights, params)
{
    if (!params) {
        params = new FaceHighlightParams ();
    }

    let result = new FaceHighlightResult ();
    if (!Array.isArray (highlights)) {
        result.reason = 'highlights must be a list';
        return { result, prepared : null };
    }
    let expectedFaceCount = params.expectedFaceCount;
    if (expectedFaceCount !== null && expectedFaceCount !== undefined && !IsValidFaceCount (expectedFaceCount)) {
        result.reason = 'expectedFaceCount must be a non-negative integer, got ' + JSON.stringify (expectedFaceCount);
        return { result, prepared : null };
    }

    let modelFaces = GetModelFaces (model);
    if (highlights.length > 0 && modelFaces.length === 0) {
        result.reason = 'the model has no BREP faces';
        return { result, prepared : null };
    }
    if (expectedFaceCount !== null && expectedFaceCount !== undefined && modelFaces.length !== expectedFaceCount) {
        result.reason = 'the model has ' + modelFaces.length.toString () + ' faces, expected ' + expectedFaceCount.toString () + ', the faces may belong to another part';
        return { result, prepared : null };
    }

    // Face index to its color.
    let faceColors = new Map ();
    for (let i = 0; i < highlights.length; i++) {
        try {
            ParseHighlight (highlights[i], modelFaces, faceColors);
        } catch (error) {
            result.reason = 'highlight ' + i.toString () + ': ' + error.message;
            return { result, prepared : null };
        }
    }

    // Group the painted faces by mesh instance, in model order.
    let facesOfInstances = new Map ();
    let sortedFaces = Array.from (faceColors.keys ()).sort ((a, b) => a - b);
    for (let faceIndex of sortedFaces) {
        let face = modelFaces[faceIndex];
        if (!facesOfInstances.has (face.meshInstance)) {
            facesOfInstances.set (face.meshInstance, []);
        }
        facesOfInstances.get (face.meshInstance).push ({ first : face.first, last : face.last, color : faceColors.get (faceIndex) });
    }

    let prepared = [];
    for (let [meshInstance, faces] of facesOfInstances) {
        let instancePrepared = PrepareMeshInstance (meshInstance, faces);
        if (instancePrepared !== null) {
            prepared.push (instancePrepared);
        }
    }

    result.ok = true;
    result.faceCount = faceColors.size;
    return { result, prepared };
}
