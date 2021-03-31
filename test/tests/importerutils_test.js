var assert = require ('assert');

describe ('Power of Two', function () {
    it ('IsPowerOfTwo', function () {
        assert (OV.IsPowerOfTwo (1));
        assert (OV.IsPowerOfTwo (2));
        assert (!OV.IsPowerOfTwo (3));
        for (let i = 4; i <= 1024; i *= 2) {
            assert (OV.IsPowerOfTwo (i));
            assert (!OV.IsPowerOfTwo (i + 1));
            assert (!OV.IsPowerOfTwo (i - 1));
            assert.strictEqual (OV.NextPowerOfTwo (i), i);
            assert.strictEqual (OV.NextPowerOfTwo (i - 1), i);
            assert.strictEqual (OV.NextPowerOfTwo (i + 1), i * 2);
        }
    });
});
