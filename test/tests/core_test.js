import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

describe ('Core', function () {
    it ('Is defined', function () {
        assert.strictEqual (OV.IsDefined (null), false);
        assert.strictEqual (OV.IsDefined (undefined), false);
        assert.strictEqual (OV.IsDefined (0), true);
        assert.strictEqual (OV.IsDefined (''), true);
    });

    it ('Value or default', function () {
        assert.strictEqual (OV.ValueOrDefault (null, 5), 5);
        assert.strictEqual (OV.ValueOrDefault (undefined, 5), 5);
        assert.strictEqual (OV.ValueOrDefault (3, 5), 3);
        assert.strictEqual (OV.ValueOrDefault ('a', 5), 'a');
    });

    it ('Copy object attributes', function () {
        let src = {
            a : null,
            b : undefined,
            c : 6
        };

        let dest = {};
        OV.CopyObjectAttributes (src, dest);
        assert.deepStrictEqual (dest, {c : 6});

        let dest2 = {
            a : 1,
            b : 2,
            c : 3
        };
        OV.CopyObjectAttributes (src, dest2);
        assert.deepStrictEqual (dest2, {a : 1, b : 2, c : 6});

        let dest3 = {
            a : null,
            b : null,
            c : null
        };
        OV.CopyObjectAttributes (src, dest3);
        assert.deepStrictEqual (dest3, {a : null, b : null, c : 6});
    });
});

}
