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

    it ('Event Notifier', function () {
        let en = new OV.EventNotifier ();
        let sumValues = 0;
        en.AddEventListener ('first_event', (x) => {
            sumValues += x;
        });
        en.AddEventListener ('first_event', (x) => {
            sumValues += 2 * x;
        });
        en.AddEventListener ('second_event', (x, y) => {
            sumValues += 3 * x;
            sumValues += 3 * y;
        });
        en.NotifyEventListeners ('first_event', 5);
        en.NotifyEventListeners ('second_event', 10, 15);
        assert.ok (en.HasEventListener ('first_event'));
        assert.ok (en.HasEventListener ('second_event'));
        assert.ok (!en.HasEventListener ('third_event'));
        assert.strictEqual (sumValues, 90);
    });
});

}
