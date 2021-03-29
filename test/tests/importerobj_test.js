var assert = require ('assert');
var testFiles = require ('../utils/testfiles.js');
var testUtils = require ('../utils/testutils.js');

describe ('Obj Importer', function() {
	it ('single_triangle.obj', function () {
		var model = testFiles.ImportObjFile ('single_triangle.obj');
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

	it ('two_triangles.obj', function () {
		var model = testFiles.ImportObjFile ('two_triangles.obj');
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

	it ('single_rectangle.obj', function () {
		var model = testFiles.ImportObjFile ('single_rectangle.obj');
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

	it ('single_triangle_with_comments.obj', function () {
		var model = testFiles.ImportObjFile ('single_triangle_with_comments.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : 'MyMeshName',
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

	it ('single_triangle_negative_indices.obj', function () {
		var model = testFiles.ImportObjFile ('single_triangle_negative_indices.obj');
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

	it ('single_triangle_with_normals_and_uvs.obj', function () {
		var model = testFiles.ImportObjFile ('single_triangle_with_normals_and_uvs.obj');
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
							uvs : [0, 0, 1, 0, 1, 1],
							mat : 0
						}
					]
				}
			]
		});
	});

	it ('single_triangle_in_mesh.obj', function () {
		var model = testFiles.ImportObjFile ('single_triangle_in_mesh.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : 'MeshName',
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

	it ('two_triangles_in_meshes.obj', function () {
		var model = testFiles.ImportObjFile ('two_triangles_in_meshes.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : 'MeshName1',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}
					]
				},
				{
					name : 'MeshName2',
					triangles : [
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

	it ('empty_meshes.obj', function () {
		var model = testFiles.ImportObjFile ('empty_meshes.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : 'MeshName1',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}
					]
				},
				{
					name : 'MeshName2',
					triangles : [
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

	it ('single_triangle_with_material.obj', function () {
		var model = testFiles.ImportObjFile ('single_triangle_with_material.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : 'MaterialName1' },
				{ name : 'MaterialName2' }
			],
			meshes : [
				{
					name : 'MeshName',
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

	it ('two_triangles_with_material.obj', function () {
		var model = testFiles.ImportObjFile ('two_triangles_with_material.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : 'MaterialName1' },
				{ name : 'MaterialName2' }
			],
			meshes : [
				{
					name : 'MeshName',
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
							mat : 1
						}						
					]
				}
			]
		});
	});

	it ('two_meshes_same_vertices.obj', function () {
		var model = testFiles.ImportObjFile ('two_meshes_same_vertices.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : 'MeshName1',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						}
					]
				},
				{
					name : 'MeshName2',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 0, 0, 1],
							normals : [0, -1, 0, 0, -1, 0, 0, -1, 0],
							uvs : [],
							mat : 0
						}
					]
				}				
			]
		});
	});

	it ('two_meshes_with_same_name.obj', function () {
		var model = testFiles.ImportObjFile ('two_meshes_with_same_name.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : '' }
			],
			meshes : [
				{
					name : 'MeshName',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [],
							mat : 0
						},
						{
							vertices : [0, 0, 0, 1, 0, 0, 0, 0, 1],
							normals : [0, -1, 0, 0, -1, 0, 0, -1, 0],
							uvs : [],
							mat : 0
						}
					]
				}				
			]
		});
	});

	it ('rectangle_with_texture.obj', function () {
		var model = testFiles.ImportObjFile ('rectangle_with_texture.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObject (model), {
			name : '',
			materials : [
				{ name : 'Material' }
			],
			meshes : [
				{
					name : 'Mesh',
					triangles : [
						{
							vertices : [0, 0, 0, 1, 0, 0, 1, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [0, 0, 1, 0, 1, 1],
							mat : 0
						},
						{
							vertices : [0, 0, 0, 1, 1, 0, 0, 1, 0],
							normals : [0, 0, 1, 0, 0, 1, 0, 0, 1],
							uvs : [0, 0, 1, 1, 0, 1],
							mat : 0
						}
					]
				}				
			]
		});
	});	

	it ('cube_with_materials.obj', function () {
		var model = testFiles.ImportObjFile ('cube_with_materials.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
			name : '',
			materials : [
				{ name : 'Red' },
				{ name : 'Green' },
				{ name : 'Blue' },
				{ name : 'White' },
				{ name : 'Texture' }
			],
			meshes : [
				{
					name : 'Cube',
					vertexCount : 8,
					normalCount : 6,
					uvCount : 4,
					triangleCount : 12,
					boundingBox : {
						min : [0, 0, 0],
						max : [1, 1, 1]
					}
				}
			]
		});
	});

	it ('cube_rgb.obj', function () {
		var model = testFiles.ImportObjFile ('cube_rgb.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
			name : '',
			materials : [
				{ name : 'Red' },
				{ name : 'Green' },
				{ name : 'Blue' },
				{ name : 'White' }
			],
			meshes : [
				{
					name : 'Cube',
					vertexCount : 8,
					normalCount : 6,
					uvCount : 4,
					triangleCount : 12,
					boundingBox : {
						min : [0, 0, 0],
						max : [1, 1, 1]
					}
				}
			]
		});
	});

	it ('cube_with_materials_comments.obj', function () {
		var model = testFiles.ImportObjFile ('cube_with_materials_comments.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
			name : '',
			materials : [
				{ name : 'Red' },
				{ name : 'Green' },
				{ name : 'Blue' },
				{ name : 'White' },
				{ name : 'Texture' }
			],
			meshes : [
				{
					name : 'Cube',
					vertexCount : 8,
					normalCount : 6,
					uvCount : 4,
					triangleCount : 12,
					boundingBox : {
						min : [0, 0, 0],
						max : [1, 1, 1]
					}
				}
			]
		});
	});
	
	it ('cube with white spaces.obj', function () {
		var model = testFiles.ImportObjFile ('cube with white spaces.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
			name : '',
			materials : [
				{ name : 'Red Color' },
				{ name : 'Green Color' },
				{ name : 'Blue Color' },
				{ name : 'White  Color' },
				{ name : 'Texture Color' }
			],
			meshes : [
				{
					name : 'Cube Mesh',
					vertexCount : 8,
					normalCount : 6,
					uvCount : 4,
					triangleCount : 12,
					boundingBox : {
						min : [0, 0, 0],
						max : [1, 1, 1]
					}
				}
			]
		});
	});	

	it ('icosahedron.obj', function () {
		var model = testFiles.ImportObjFile ('icosahedron.obj');
		assert (OV.CheckModel (model));
		assert.deepStrictEqual (testUtils.ModelToObjectSimple (model), {
			name : '',
			materials : [
				{ name : 'Blue' }
			],
			meshes : [
				{
					name : 'Icosahedron',
					vertexCount : 12,
					normalCount : 20,
					uvCount : 0,
					triangleCount : 20,
					boundingBox : {
						min : [-0.85065080835204, -0.85065080835204, -0.85065080835204],
						max : [0.85065080835204, 0.85065080835204, 0.85065080835204]
					}
				}
			]
		});
	});

	it ('hundred_cubes.obj', function () {
		var model = testFiles.ImportObjFile ('hundred_cubes.obj');
		assert (OV.CheckModel (model));
		assert.strictEqual (model.MaterialCount (), 3);
		assert.strictEqual (model.MeshCount (), 100);
	});
});
