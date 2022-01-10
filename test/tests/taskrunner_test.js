import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

describe ('Task Runner', function () {
    it ('Run task zero times', function (done) {
        var numbers = [];
        OV.RunTasks (0, {
            runTask : function (index, ready) {
                numbers.push (index);
                ready ();
            },
            onReady : function () {
                assert.deepStrictEqual (numbers, []);
                done ();
            }
        });
    });

    it ('Run task three times', function (done) {
        var numbers = [];
        OV.RunTasks (3, {
            runTask : function (index, ready) {
                numbers.push (index);
                ready ();
            },
            onReady : function () {
                assert.deepStrictEqual (numbers, [0, 1, 2]);
                done ();
            }
        });
    });

    it ('Run task batched', function (done) {
        var indices = [];
        OV.RunTasksBatch (10, 3, {
            runTask : function (firstIndex, lastIndex, ready) {
                indices.push ([firstIndex, lastIndex]);
                ready ();
            },
            onReady : function () {
                assert.deepStrictEqual (indices, [[0, 2], [3, 5], [6, 8], [9, 9]]);
                done ();
            }
        });
    });

    it ('Run task batched zero times', function (done) {
        var indices = [];
        OV.RunTasksBatch (0, 3, {
            runTask : function (firstIndex, lastIndex, ready) {
                indices.push ([firstIndex, lastIndex]);
                ready ();
            },
            onReady : function () {
                assert.deepStrictEqual (indices, []);
                done ();
            }
        });
    });
});

}
