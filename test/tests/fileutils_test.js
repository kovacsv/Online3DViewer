import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

function GetLines (str)
{
    var lines = [];
    OV.ReadLines (str, function (line) {
        lines.push (line);
    });
    return lines;
}

describe ('File Utils', function () {
    it ('Get File Extension', function () {
        assert.strictEqual (OV.GetFileExtension ('file'), '');
        assert.strictEqual (OV.GetFileExtension ('file.obj'), 'obj');
        assert.strictEqual (OV.GetFileExtension ('file.OBJ'), 'obj');
    });

    it ('Get File Name', function () {
        assert.strictEqual (OV.GetFileName ('file'), 'file');
        assert.strictEqual (OV.GetFileName ('file.obj'), 'file.obj');
        assert.strictEqual (OV.GetFileName ('file.OBJ'), 'file.OBJ');
        assert.strictEqual (OV.GetFileName ('folder/file'), 'file');
        assert.strictEqual (OV.GetFileName ('folder/file.obj'), 'file.obj');
        assert.strictEqual (OV.GetFileName ('folder/file.OBJ'), 'file.OBJ');
        assert.strictEqual (OV.GetFileName ('folder\\file'), 'file');
        assert.strictEqual (OV.GetFileName ('folder\\file.obj'), 'file.obj');
        assert.strictEqual (OV.GetFileName ('folder\\file.OBJ'), 'file.OBJ');
        assert.strictEqual (OV.GetFileName ('file.obj?a=b&c=d'), 'file.obj');
        assert.strictEqual (OV.GetFileName ('file.obj?param=a/b/c'), 'file.obj');
    });

    it ('Read Lines', function () {
        assert.deepStrictEqual (GetLines (''), []);
        assert.deepStrictEqual (GetLines ('\n'), []);
        assert.deepStrictEqual (GetLines ('\r\n'), []);
        assert.deepStrictEqual (GetLines ('a\nb'), ['a', 'b']);
        assert.deepStrictEqual (GetLines ('apple\nbanana'), ['apple', 'banana']);
        assert.deepStrictEqual (GetLines ('apple\r\nbanana'), ['apple', 'banana']);
        assert.deepStrictEqual (GetLines ('apple\r\n'), ['apple']);
        assert.deepStrictEqual (GetLines ('\r\napple\r\n'), ['apple']);
    });

    it ('Is URL', function () {
        assert.ok (!OV.IsUrl (''));
        assert.ok (!OV.IsUrl ('google'));
        assert.ok (!OV.IsUrl ('google.com'));
        assert.ok (!OV.IsUrl ('the http://google.com'));
        assert.ok (!OV.IsUrl ('http://google.com the'));
        assert.ok (OV.IsUrl ('http://google.com'));
        assert.ok (OV.IsUrl ('https://google.com'));
        assert.ok (OV.IsUrl ('http://www.google.com'));
        assert.ok (OV.IsUrl ('https://www.google.com'));
        assert.ok (OV.IsUrl ('https://www.google.com#param1=a&param2=b'));
        assert.ok (OV.IsUrl ('https://www.google.com?param1=a&param2=a'));
    });
});

}
