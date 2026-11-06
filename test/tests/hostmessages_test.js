import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';
import { HostMessageHandler, HostMessageType } from '../../source/website/hostmessages.js';

export default function suite ()
{

const Origin = 'https://app.example.com';

// A window inside an iframe, the parent records what the website posts to it.
function CreateFrameWindow ()
{
    let parent = {
        posted : [],
        postMessage (message, targetOrigin) {
            this.posted.push ({ message, targetOrigin });
        }
    };
    let listeners = [];
    let frameWindow = {
        parent : parent,
        location : { origin : Origin },
        addEventListener (type, listener) {
            assert.strictEqual (type, 'message');
            listeners.push (listener);
        },
        listenerCount () {
            return listeners.length;
        },
        Send (data, source, origin) {
            let event = {
                data : data,
                source : (source === undefined ? parent : source),
                origin : (origin === undefined ? Origin : origin)
            };
            for (let listener of listeners) {
                listener (event);
            }
        }
    };
    return frameWindow;
}

// Records the calls the handler makes, the results can be set per test.
function CreateFakeOverlays ()
{
    return {
        model : null,
        calls : [],
        edgeResult : { ok : true, reason : null, edgeCount : 1 },
        strainResult : { ok : true, reason : null },
        colorsResult : { ok : true, reason : null, colorScale : {} },
        HasModel () {
            return this.model !== null;
        },
        ShowEdgeHighlights (edges) {
            this.calls.push (['ShowEdgeHighlights', edges]);
            return this.edgeResult;
        },
        ClearEdgeHighlights () {
            this.calls.push (['ClearEdgeHighlights']);
        },
        ShowSurfaceStrain (buffer, params) {
            this.calls.push (['ShowSurfaceStrain', buffer, params.thresholds]);
            let result = this.strainResult;
            return new Promise ((resolve) => {
                setTimeout (() => resolve (result), 0);
            });
        },
        SetSurfaceStrainColors (params) {
            this.calls.push (['SetSurfaceStrainColors', params.thresholds]);
            return this.colorsResult;
        },
        ClearSurfaceStrain () {
            this.calls.push (['ClearSurfaceStrain']);
        },
        SetModelOpacity (opacity) {
            this.calls.push (['SetModelOpacity', opacity]);
            if (typeof opacity !== 'number' || !(opacity > 0 && opacity <= 1)) {
                return { ok : false, reason : 'opacity must be a number in (0, 1]' };
            }
            return { ok : true, reason : null };
        }
    };
}

function Flush ()
{
    return new Promise ((resolve) => {
        setTimeout (resolve, 5);
    });
}

function CreateHandler ()
{
    let frameWindow = CreateFrameWindow ();
    let overlays = CreateFakeOverlays ();
    let handler = new HostMessageHandler (frameWindow, overlays);
    assert.ok (handler.Install ());
    return { frameWindow, overlays, handler };
}

function LoadModel (env)
{
    env.overlays.model = {};
    env.handler.OnModelLoaded ();
}

function Posted (env, type)
{
    return env.frameWindow.parent.posted.map ((item) => item.message).filter ((message) => message.type === type);
}

function Results (env)
{
    return Posted (env, HostMessageType.Result);
}

const Edges = [{ polyline : [[0, 0, 0], [1, 0, 0]], color : '#ff0000' }];
const Thresholds = [{ color : '#ff0000', strain : 20.0 }, { color : '#ffff00', strain : 5.0 }];
const OtherThresholds = [{ color : '#ff0000', strain : 30.0 }];

describe ('Host Messages', function () {
    it ('Does nothing outside an iframe', function () {
        let frameWindow = CreateFrameWindow ();
        frameWindow.parent = frameWindow;
        let handler = new HostMessageHandler (frameWindow, CreateFakeOverlays ());
        assert.ok (!handler.Install ());
        assert.strictEqual (frameWindow.listenerCount (), 0);
        handler.OnModelLoaded ();
        handler.OnModelLoadFailed ();
    });

    it ('Posts ready and load events to the own origin', function () {
        let env = CreateHandler ();
        assert.strictEqual (env.frameWindow.listenerCount (), 1);
        LoadModel (env);
        env.handler.OnModelLoadFailed ();
        let posted = env.frameWindow.parent.posted;
        assert.deepStrictEqual (posted.map ((item) => item.message.type), [
            HostMessageType.Ready, HostMessageType.ModelLoaded, HostMessageType.ModelLoadFailed
        ]);
        for (let item of posted) {
            assert.strictEqual (item.targetOrigin, Origin);
        }
    });

    it ('Ignores messages from a foreign origin or source', async function () {
        let env = CreateHandler ();
        LoadModel (env);
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges }, env.frameWindow.parent, 'https://evil.example.com');
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges }, {}, Origin);
        env.frameWindow.Send ({ type : HostMessageType.ModelOpacitySet, opacity : 0.2 }, env.frameWindow.parent, 'https://evil.example.com');
        env.frameWindow.Send ({ type : HostMessageType.ModelOpacitySet, opacity : 0.2 }, {}, Origin);
        env.frameWindow.Send (null);
        env.frameWindow.Send ('o3dv:edge-highlights:show');
        env.frameWindow.Send ({ type : 'something-else' });
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, []);
        assert.deepStrictEqual (Results (env), []);
    });

    it ('Sends each command to the viewer', async function () {
        let env = CreateHandler ();
        LoadModel (env);
        let buffer = new ArrayBuffer (8);
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges, requestId : 1 });
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsClear, requestId : 2 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainShow, buffer : buffer, thresholds : Thresholds, requestId : 3 });
        await Flush ();
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainColors, thresholds : OtherThresholds, requestId : 4 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainClear, requestId : 5 });
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, [
            ['ShowEdgeHighlights', Edges],
            ['ClearEdgeHighlights'],
            ['ShowSurfaceStrain', buffer, Thresholds],
            ['SetSurfaceStrainColors', OtherThresholds],
            ['ClearSurfaceStrain']
        ]);
        assert.deepStrictEqual (Results (env), [
            { type : HostMessageType.Result, requestId : 1, command : HostMessageType.EdgeHighlightsShow, ok : true, reason : null },
            { type : HostMessageType.Result, requestId : 2, command : HostMessageType.EdgeHighlightsClear, ok : true, reason : null },
            { type : HostMessageType.Result, requestId : 3, command : HostMessageType.SurfaceStrainShow, ok : true, reason : null },
            { type : HostMessageType.Result, requestId : 4, command : HostMessageType.SurfaceStrainColors, ok : true, reason : null },
            { type : HostMessageType.Result, requestId : 5, command : HostMessageType.SurfaceStrainClear, ok : true, reason : null }
        ]);
    });

    it ('Applies commands sent before the model on load', async function () {
        let env = CreateHandler ();
        let buffer = new ArrayBuffer (8);
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges, requestId : 'e' });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainShow, buffer : buffer, thresholds : Thresholds, requestId : 's' });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainColors, thresholds : OtherThresholds, requestId : 'c' });
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, []);
        assert.deepStrictEqual (Results (env), []);

        LoadModel (env);
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, [
            ['ShowEdgeHighlights', Edges],
            ['ShowSurfaceStrain', buffer, OtherThresholds]
        ]);
        assert.deepStrictEqual (Results (env).map ((result) => [result.requestId, result.ok]), [
            ['e', true], ['s', true], ['c', true]
        ]);
    });

    it ('Answers commands replaced or cleared before the model', async function () {
        let env = CreateHandler ();
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : [], requestId : 1 });
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges, requestId : 2 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainShow, buffer : new ArrayBuffer (8), requestId : 3 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainClear, requestId : 4 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainColors, thresholds : Thresholds, requestId : 5 });
        assert.deepStrictEqual (Results (env).map ((result) => [result.requestId, result.ok]), [
            [1, false], [3, false], [4, true], [5, false]
        ]);
        LoadModel (env);
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, [
            ['ClearSurfaceStrain'],
            ['ShowEdgeHighlights', Edges]
        ]);
        assert.deepStrictEqual (Results (env).map ((result) => [result.requestId, result.ok]).slice (4), [[2, true]]);
    });

    it ('Reapplies the overlays after a second model load', async function () {
        let env = CreateHandler ();
        LoadModel (env);
        let buffer = new ArrayBuffer (8);
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges, requestId : 1 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainShow, buffer : buffer, thresholds : Thresholds, requestId : 2 });
        await Flush ();
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainColors, thresholds : OtherThresholds, requestId : 3 });
        env.overlays.calls = [];

        env.overlays.model = null;
        LoadModel (env);
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, [
            ['ShowEdgeHighlights', Edges],
            ['ShowSurfaceStrain', buffer, OtherThresholds]
        ]);
        assert.deepStrictEqual (Results (env).slice (3), [
            { type : HostMessageType.Result, requestId : null, command : HostMessageType.EdgeHighlightsShow, ok : true, reason : null },
            { type : HostMessageType.Result, requestId : null, command : HostMessageType.SurfaceStrainShow, ok : true, reason : null }
        ]);
        assert.strictEqual (Posted (env, HostMessageType.ModelLoaded).length, 2);
    });

    it ('Posts ok false for a failed show', async function () {
        let env = CreateHandler ();
        LoadModel (env);
        env.overlays.edgeResult = { ok : false, reason : 'edge 0: not on the model', edgeCount : 0 };
        env.overlays.strainResult = { ok : false, reason : 'the artifact belongs to another part' };
        env.frameWindow.Send ({ type : HostMessageType.EdgeHighlightsShow, edges : Edges, requestId : 1 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainShow, buffer : new ArrayBuffer (8), requestId : 2 });
        await Flush ();
        assert.deepStrictEqual (Results (env).map ((result) => [result.requestId, result.ok, result.reason]), [
            [1, false, 'edge 0: not on the model'],
            [2, false, 'the artifact belongs to another part']
        ]);
        // The handler doesn't clear anything itself, the parent decides.
        assert.ok (!env.overlays.calls.some ((call) => call[0].startsWith ('Clear')));
    });

    it ('Sets the model opacity at once, with or without a model', async function () {
        let env = CreateHandler ();
        env.frameWindow.Send ({ type : HostMessageType.ModelOpacitySet, opacity : 0.2, requestId : 1 });
        env.frameWindow.Send ({ type : HostMessageType.ModelOpacitySet, opacity : 1.5, requestId : 2 });
        assert.deepStrictEqual (Results (env), [
            { type : HostMessageType.Result, requestId : 1, command : 'o3dv:model-opacity:set', ok : true, reason : null },
            { type : HostMessageType.Result, requestId : 2, command : 'o3dv:model-opacity:set', ok : false, reason : 'opacity must be a number in (0, 1]' }
        ]);
        // The viewer keeps the setting, a model load doesn't apply or answer it again.
        LoadModel (env);
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls, [['SetModelOpacity', 0.2], ['SetModelOpacity', 1.5]]);
        assert.strictEqual (Results (env).length, 2);
    });

    it ('Applies colors that arrive while the strain is mapped', async function () {
        let env = CreateHandler ();
        LoadModel (env);
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainShow, buffer : new ArrayBuffer (8), thresholds : Thresholds, requestId : 1 });
        env.frameWindow.Send ({ type : HostMessageType.SurfaceStrainColors, thresholds : OtherThresholds, requestId : 2 });
        await Flush ();
        assert.deepStrictEqual (env.overlays.calls.slice (1), [['SetSurfaceStrainColors', OtherThresholds]]);
        assert.deepStrictEqual (Results (env).map ((result) => [result.requestId, result.ok]), [[1, true], [2, true]]);
    });
});

describe ('Viewer Overlays', function () {
    function CreateBoxModel ()
    {
        let model = new OV.Model ();
        model.SetUnit (OV.Unit.Millimeter);
        let mesh = OV.GenerateCuboid (null, 100.0, 20.0, 10.0);
        let meshIndex = model.AddMesh (mesh);
        model.GetRootNode ().AddMeshIndex (meshIndex);
        return model;
    }

    function CreateFakeViewer ()
    {
        return {
            edgeHighlights : null,
            surfaceStrain : null,
            SetEdgeHighlights (prepared) {
                this.edgeHighlights = prepared;
            },
            ClearEdgeHighlights () {
                this.edgeHighlights = null;
            },
            HasSurfaceStrain () {
                return this.surfaceStrain !== null;
            },
            SetSurfaceStrain (mapping, colorScale) {
                this.surfaceStrain = mapping;
            },
            ClearSurfaceStrain () {
                this.surfaceStrain = null;
            }
        };
    }

    it ('Fails without a model', async function () {
        let overlays = new OV.ViewerOverlays (CreateFakeViewer ());
        assert.ok (!overlays.HasModel ());
        assert.strictEqual (overlays.ShowEdgeHighlights (Edges).reason, 'no model is loaded');
        assert.strictEqual ((await overlays.ShowSurfaceStrain (new ArrayBuffer (8))).reason, 'no model is loaded');
        assert.strictEqual (overlays.SetSurfaceStrainColors (null).reason, 'no surface strain is shown');
    });

    it ('Keeps the shown edges after a failed call', function () {
        let viewer = CreateFakeViewer ();
        let overlays = new OV.ViewerOverlays (viewer);
        overlays.SetModel (CreateBoxModel ());
        let edges = [{ polyline : [[0, 0, 0], [100, 0, 0]], color : '#ff0000' }];
        assert.ok (overlays.ShowEdgeHighlights (edges).ok);
        let shown = viewer.edgeHighlights;
        assert.ok (shown !== null);
        let result = overlays.ShowEdgeHighlights ([{ polyline : [[0, 500, 0], [100, 500, 0]], color : '#ff0000' }]);
        assert.ok (!result.ok);
        assert.strictEqual (viewer.edgeHighlights, shown);
    });

    it ('Doesn\'t paint a strain after the model changed', async function () {
        let viewer = CreateFakeViewer ();
        let overlays = new OV.ViewerOverlays (viewer);
        overlays.SetModel (CreateBoxModel ());
        let promise = overlays.ShowSurfaceStrain (new ArrayBuffer (8));
        overlays.SetModel (CreateBoxModel ());
        let result = await promise;
        assert.ok (!result.ok);
        assert.strictEqual (viewer.surfaceStrain, null);
    });
});

}
