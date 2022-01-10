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
});

}
