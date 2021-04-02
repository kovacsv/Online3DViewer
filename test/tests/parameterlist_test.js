var assert = require ('assert');

describe ('Url Utils', function () {
    it ('Url builder', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0)
        );
        let urlParams1 = new OV.ParameterListBuilder ().AddModelUrls (modelUrls).GetUrlParams ();
        let urlParams2 = new OV.ParameterListBuilder ().AddCamera (camera).GetUrlParams ();
        let urlParams3 = new OV.ParameterListBuilder ().AddModelUrls (modelUrls).AddCamera (camera).GetUrlParams ();
        assert.strictEqual (urlParams1, 'model=a.txt,b.txt');
        assert.strictEqual (urlParams2, 'camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
        assert.strictEqual (urlParams3, 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
    });

    it ('Url parser', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0)
        );        
        let urlParamsLegacy = 'a.txt,b.txt';
        let urlParams1 = 'model=a.txt,b.txt';
        let urlParams2 = 'camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000';
        let urlParams3 = 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000';
        let parserLegacy = new OV.ParameterListParser (urlParamsLegacy);
        assert.deepStrictEqual (parserLegacy.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parserLegacy.GetCamera (), null);
        let parser1 = new OV.ParameterListParser (urlParams1);
        assert.deepStrictEqual (parser1.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser1.GetCamera (), null);
        let parser2 = new OV.ParameterListParser (urlParams2);
        assert.deepStrictEqual (parser2.GetModelUrls (), null);
        assert.deepStrictEqual (parser2.GetCamera (), camera);
        let parser3 = new OV.ParameterListParser (urlParams3);
        assert.deepStrictEqual (parser3.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser3.GetCamera (), camera);
    });
});
