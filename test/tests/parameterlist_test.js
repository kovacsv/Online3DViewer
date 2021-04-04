var assert = require ('assert');

describe ('Parameter List', function () {
    it ('Parameter list builder', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0)
        );
        let urlParams1 = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).GetUrlParams ();
        let urlParams2 = OV.CreateUrlBuilder ().AddCamera (camera).GetUrlParams ();
        let urlParams3 = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).AddCamera (camera).GetUrlParams ();
        assert.strictEqual (urlParams1, 'model=a.txt,b.txt');
        assert.strictEqual (urlParams2, 'camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
        assert.strictEqual (urlParams3, 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
    });

    it ('Parameter list parser', function () {
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
        let parserLegacy = OV.CreateUrlParser (urlParamsLegacy);
        assert.deepStrictEqual (parserLegacy.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parserLegacy.GetCamera (), null);
        let parser1 = OV.CreateUrlParser (urlParams1);
        assert.deepStrictEqual (parser1.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser1.GetCamera (), null);
        let parser2 = OV.CreateUrlParser (urlParams2);
        assert.deepStrictEqual (parser2.GetModelUrls (), null);
        assert.deepStrictEqual (parser2.GetCamera (), camera);
        let parser3 = OV.CreateUrlParser (urlParams3);
        assert.deepStrictEqual (parser3.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser3.GetCamera (), camera);
    });
});
