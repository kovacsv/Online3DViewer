var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('Off Importer', function() {
	it ('single_triangle.off', function () {
		var model = testFiles.ImportOffFile ('single_triangle.off');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : '',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}
					]
				}
			]
		});
	});

	it ('two_triangles.off', function () {
		var model = testFiles.ImportOffFile ('two_triangles.off');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : '',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						},
						{
							vertices : [0, 0, 1, 1, 0, 1, 1, 1, 1],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}
					]
				}
			]
		});
	});	    

	it ('single_rectangle.off', function () {
		var model = testFiles.ImportOffFile ('single_rectangle.off');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : '',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						},
						{
							vertices : [0, 0, 0, 1, 1, 0, 0, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}						
					]
				}
			]
		});
	});
    
	it ('single_triangle_with_comments.off', function () {
		var model = testFiles.ImportOffFile ('single_triangle_with_comments.off');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : '',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}
					]
				}
			]
		});
	});

	it ('cube.off', function () {
		var model = testFiles.ImportOffFile ('cube.off');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : '',
					vertexCount : 8,
					normalCount : 12,
					uvCount : 0,
					triangleCount : 12,
					boundingBox : {
						min : [0, 0, 0],
						max : [1, 1, 1]
					}
				}
			]
		});
	});		
});
