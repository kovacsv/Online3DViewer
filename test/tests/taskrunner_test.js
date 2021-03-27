var assert = require ('assert');

describe ('Task Runner', function () {
	it ('Run task zero times', function () {
		var tr = new OV.TaskRunner ();
		var numbers = [];
		tr.Run (0, {
			runTask : function (index, ready) {
				numbers.push (index);
				ready ();
			},
			onReady : function () {
				assert.deepStrictEqual (numbers, []);
			}
		});
	});

	it ('Run task three times', function () {
		var tr = new OV.TaskRunner ();
		var numbers = [];
		tr.Run (3, {
			runTask : function (index, ready) {
				numbers.push (index);
				ready ();
			},
			onReady : function () {
				assert.deepStrictEqual (numbers, [0, 1, 2]);
			}
		});
	});		
});
