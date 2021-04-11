var assert = require ('assert');

describe ('Parameter List', function () {
    it ('Parameter list builder', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0)
        );
        let color = new OV.Color (1, 2, 3);
        let urlParams1 = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).GetParameterList ();
        let urlParams2 = OV.CreateUrlBuilder ().AddCamera (camera).GetParameterList ();
        let urlParams3 = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).AddCamera (camera).GetParameterList ();
        let urlParams4 = OV.CreateUrlBuilder ().AddModelUrls (modelUrls).AddCamera (camera).AddColor (color).GetParameterList ();
        assert.strictEqual (urlParams1, 'model=a.txt,b.txt');
        assert.strictEqual (urlParams2, 'camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
        assert.strictEqual (urlParams3, 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000');
        assert.strictEqual (urlParams4, 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000$color=1,2,3');
    });

    it ('Parameter list parser', function () {
        let modelUrls = ['a.txt', 'b.txt'];
        let camera = new OV.Camera (
            new OV.Coord3D (1.0, 1.0, 1.0),
            new OV.Coord3D (0.0, 0.0, 0.0),
            new OV.Coord3D (0.0, 0.0, 1.0)
        );
        let color = new OV.Color (1, 2, 3);     
        let urlParamsLegacy = 'a.txt,b.txt';
        let urlParams1 = 'model=a.txt,b.txt';
        let urlParams2 = 'camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000';
        let urlParams3 = 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000';
        let urlParams4 = 'model=a.txt,b.txt$camera=1.0000,1.0000,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,1.0000$color=1,2,3';
        let parserLegacy = OV.CreateUrlParser (urlParamsLegacy);
        assert.deepStrictEqual (parserLegacy.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parserLegacy.GetCamera (), null);
        let parser1 = OV.CreateUrlParser (urlParams1);
        assert.deepStrictEqual (parser1.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser1.GetCamera (), null);
        assert.deepStrictEqual (parser1.GetColor (), null);
        let parser2 = OV.CreateUrlParser (urlParams2);
        assert.deepStrictEqual (parser2.GetModelUrls (), null);
        assert.deepStrictEqual (parser2.GetCamera (), camera);
        assert.deepStrictEqual (parser2.GetColor (), null);
        let parser3 = OV.CreateUrlParser (urlParams3);
        assert.deepStrictEqual (parser3.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser3.GetCamera (), camera);
        assert.deepStrictEqual (parser3.GetColor (), null);
        let parser4 = OV.CreateUrlParser (urlParams4);
        assert.deepStrictEqual (parser4.GetModelUrls (), modelUrls);
        assert.deepStrictEqual (parser4.GetCamera (), camera);
        assert.deepStrictEqual (parser4.GetColor (), color);
    });
});
