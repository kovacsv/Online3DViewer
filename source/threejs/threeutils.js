// Some mobile devices say that they support mediump, but in reality they don't. At the end
// all materials rendered as black. This hack renders a single plane with red material and
// it checks if it's really red. If it's not, then probably there is a driver issue.
// https://github.com/kovacsv/Online3DViewer/issues/69
OV.HasHighpDriverIssue = function ()
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
};

OV.ConvertThreeGeometryToMesh = function (threeGeometry, materialIndex)
{
    let mesh = new OV.Mesh ();
    let vertices = threeGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        let x = vertices[i];
        let y = vertices[i + 1];
        let z = vertices[i + 2];
        mesh.AddVertex (new OV.Coord3D (x, y, z));
    }
    let hasNormals = (threeGeometry.attributes.normal !== undefined);
    if (hasNormals) {
        let normals = threeGeometry.attributes.normal.array;
        for (let i = 0; i < normals.length; i += 3) {
            let x = normals[i];
            let y = normals[i + 1];
            let z = normals[i + 2];
            mesh.AddNormal (new OV.Coord3D (x, y, z));
        }		
    }
    let hasUVs = (threeGeometry.attributes.uv !== undefined);
    if (hasUVs) {
        let uvs = threeGeometry.attributes.uv.array;
        for (let i = 0; i < uvs.length; i += 2) {
            let x = uvs[i];
            let y = uvs[i + 1];
            mesh.AddTextureUV (new OV.Coord2D (x, y));
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
        let triangle = new OV.Triangle (v0, v1, v2);
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
};
