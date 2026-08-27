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

    it ('Transform file host urls', function () {
        let urls = [
            'https://www.dropbox.com/s/abc/model.obj',
            'https://github.com/user/repo/blob/main/model.obj'
        ];
        OV.TransformFileHostUrls (urls);
        assert.strictEqual (urls[0], 'https://dl.dropbox.com/s/abc/model.obj');
        assert.strictEqual (urls[1], 'https://raw.githubusercontent.com/user/repo/main/model.obj');
    });

    it ('Transform file host urls only matches the host', function () {
        // A host that merely embeds the name must not be rewritten.
        let urls = [
            'https://evil.example/?x=www.dropbox.com',
            'https://github.com.evil.example/user/repo/blob/main/model.obj',
            'https://notgithub.com/user/repo/blob/main/model.obj',
            'https://dropbox.com/s/abc/model.obj',
            'not a url'
        ];
        let expected = urls.slice ();
        OV.TransformFileHostUrls (urls);
        assert.deepStrictEqual (urls, expected);
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
