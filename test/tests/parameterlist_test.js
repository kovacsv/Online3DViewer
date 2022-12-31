import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { EdgeSettings } from '../../source/engine/viewer/viewermodel.js';

export default function suite ()
{

describe ('Parameter List', function () {
    it ('Parameter list builder', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0),
            45.0
        );
        let background = new OV.RGBAColor (4, 5, 6, 7);
        let color = new OV.RGBColor (1, 2, 3);
        {
            let urlParams = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).GetParameterList ();
            assert.strictEqual (urlParams, 'model=a.txt,b.txt');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddCamera (camera).GetParameterList ();
            assert.strictEqual (urlParams, 'camera=1.00000,1.00000,1.00000,0.00000,0.00000,0.00000,0.00000,0.00000,1.00000,45.00000');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).AddCamera (camera).GetParameterList ();
            assert.strictEqual (urlParams, 'model=a.txt,b.txt$camera=1.00000,1.00000,1.00000,0.00000,0.00000,0.00000,0.00000,0.00000,1.00000,45.00000');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).AddCamera (camera).AddDefaultColor (color).GetParameterList ();
            assert.strictEqual (urlParams, 'model=a.txt,b.txt$camera=1.00000,1.00000,1.00000,0.00000,0.00000,0.00000,0.00000,0.00000,1.00000,45.00000$defaultcolor=1,2,3');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).AddCamera (camera).AddBackgroundColor (background).AddDefaultColor (color).GetParameterList ();
            assert.strictEqual (urlParams, 'model=a.txt,b.txt$camera=1.00000,1.00000,1.00000,0.00000,0.00000,0.00000,0.00000,0.00000,1.00000,45.00000$backgroundcolor=4,5,6,7$defaultcolor=1,2,3');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddEdgeSettings (new EdgeSettings (
                true,
                new OV.RGBColor (1, 2, 3),
                15
            )).GetParameterList ();
            assert.strictEqual (urlParams, 'edgesettings=on,1,2,3,15');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddCameraMode (OV.CameraMode.Perspective).GetParameterList ();
            assert.strictEqual (urlParams, 'cameramode=perspective');
        }
        {
            let urlParams = OV.CreateUrlBuilder ().AddCameraMode (OV.CameraMode.Orthographic).GetParameterList ();
            assert.strictEqual (urlParams, 'cameramode=orthographic');
        }
    });

    it ('Parameter list parser', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0),
            45.0
        );
        let background = new OV.RGBAColor (4, 5, 6, 7);
        let color = new OV.RGBColor (1, 2, 3);

        {
            let parser = OV.CreateUrlParser ('a.txt,b.txt');
            assert.deepStrictEqual (parser.GetModelUrls (), modelUrls);
            assert.deepStrictEqual (parser.GetCamera (), null);
        }

        {
            let parser = OV.CreateUrlParser ('model=a.txt,b.txt');
            assert.deepStrictEqual (parser.GetModelUrls (), modelUrls);
            assert.deepStrictEqual (parser.GetCamera (), null);
            assert.deepStrictEqual (parser.GetDefaultColor (), null);
        }

        {
            let parser = OV.CreateUrlParser ('camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
            assert.deepStrictEqual (parser.GetModelUrls (), null);
            assert.deepStrictEqual (parser.GetCamera (), camera);
            assert.deepStrictEqual (parser.GetDefaultColor (), null);
        }

        {
            let parser = OV.CreateUrlParser ('camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000,60.0000');
            assert.deepStrictEqual (parser.GetModelUrls (), null);
            assert.deepStrictEqual (parser.GetCamera (), new OV.Camera (new OV.Coord3D (1.0, 1.0, 1.0), new OV.Coord3D (0.0, 0.0, 0.0), new OV.Coord3D (0.0, 0.0, 1.0), 60.0));
            assert.deepStrictEqual (parser.GetDefaultColor (), null);
        }

        {
            let parser = OV.CreateUrlParser ('model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
            assert.deepStrictEqual (parser.GetModelUrls (), modelUrls);
            assert.deepStrictEqual (parser.GetCamera (), camera);
            assert.deepStrictEqual (parser.GetDefaultColor (), null);
        }

        {
            let parser = OV.CreateUrlParser ('model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000$defaultcolor=1,2,3');
            assert.deepStrictEqual (parser.GetModelUrls (), modelUrls);
            assert.deepStrictEqual (parser.GetCamera (), camera);
            assert.deepStrictEqual (parser.GetDefaultColor (), color);
        }

        {
            let parser = OV.CreateUrlParser ('model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000$backgroundcolor=4,5,6,7$defaultcolor=1,2,3');
            assert.deepStrictEqual (parser.GetModelUrls (), modelUrls);
            assert.deepStrictEqual (parser.GetCamera (), camera);
            assert.deepStrictEqual (parser.GetDefaultColor (), color);
            assert.deepStrictEqual (parser.GetBackgroundColor (), background);
        }

        {
            let parser = OV.CreateUrlParser ('edgesettings=on,1,2,3,15');
            assert.deepStrictEqual (parser.GetEdgeSettings (), new EdgeSettings (
                true,
                new OV.RGBColor (1, 2, 3),
                15
            ));
        }
        {
            let parser = OV.CreateUrlParser ('cameramode=perspective');
            assert.deepStrictEqual (parser.GetCameraMode (), OV.CameraMode.Perspective);
        }
        {
            let parser = OV.CreateUrlParser ('cameramode=orthographic');
            assert.deepStrictEqual (parser.GetCameraMode (), OV.CameraMode.Orthographic);
        }
    });
});

}
