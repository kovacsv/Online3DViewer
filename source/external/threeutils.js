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
