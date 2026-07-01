import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

describe ('Power of Two', function () {
    it ('IsPowerOfTwo', function () {
        assert.ok (OV.IsPowerOfTwo (1));
        assert.ok (OV.IsPowerOfTwo (2));
        assert.ok (!OV.IsPowerOfTwo (3));
        for (let i = 4; i <= 1024; i *= 2) {
            assert.ok (OV.IsPowerOfTwo (i));
            assert.ok (!OV.IsPowerOfTwo (i + 1));
            assert.ok (!OV.IsPowerOfTwo (i - 1));
            assert.strictEqual (OV.NextPowerOfTwo (i), i);
            assert.strictEqual (OV.NextPowerOfTwo (i - 1), i);
            assert.strictEqual (OV.NextPowerOfTwo (i + 1), i * 2);
        }
    });
});

describe ('OCCT Import Js', function () {
    it ('Set base url', function () {
        let defaultBaseUrl = OV.GetOcctImportJsBaseUrl ();

        OV.SetOcctImportJsBaseUrl ('./assets/occt');
        assert.strictEqual (OV.GetOcctImportJsBaseUrl (), './assets/occt');

        OV.SetOcctImportJsBaseUrl (null);
        assert.strictEqual (OV.GetOcctImportJsBaseUrl (), defaultBaseUrl);
    });
});

}
