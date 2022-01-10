import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

function CreateTestModel ()
{
    let model = new OV.Model ();

    let material1 = new OV.PhongMaterial ();
    material1.name = 'TestMaterial1';
    material1.ambient = new OV.Color (0, 0, 0);
    material1.color = new OV.Color (255, 0, 0);
    material1.specular = new OV.Color (51, 51, 51);
    material1.diffuseMap = new OV.TextureMap ();
    material1.diffuseMap.name = 'textures/texture1.png';
    material1.diffuseMap.url = 'texture1_url';
    material1.diffuseMap.buffer = new ArrayBuffer (1);
    material1.specularMap = new OV.TextureMap ();
    material1.specularMap.name = 'textures/texture2.png';
    material1.specularMap.url = 'texture2_url';
    material1.specularMap.buffer = new ArrayBuffer (2);
    material1.bumpMap = new OV.TextureMap ();
    material1.bumpMap.name = 'textures/texture3.png';
    material1.bumpMap.url = 'texture3_url';
    material1.bumpMap.buffer = new ArrayBuffer (3);
    model.AddMaterial (material1);

    let material2 = new OV.PhongMaterial ();
    material2.name = 'TestMaterial2';
    material2.ambient = new OV.Color (0, 0, 0);
    material2.color = new OV.Color (0, 255, 0);
    material2.specular = new OV.Color (51, 51, 51);
    model.AddMaterial (material2);

    let mesh1 = new OV.Mesh ();
    mesh1.SetName ('TestMesh1');
    mesh1.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
    mesh1.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
    mesh1.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
    let triangle1 = new OV.Triangle (0, 1, 2);
    triangle1.mat = 0;
    mesh1.AddTriangle (triangle1);
    model.AddMeshToRootNode (mesh1);

    let mesh2 = new OV.Mesh ();
    mesh2.SetName ('TestMesh2');
    mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    mesh2.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    mesh2.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    mesh2.AddVertex (new OV.Coord3D (-1.0, 0.0, 0.0));
    mesh2.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
    let triangle2 = new OV.Triangle (0, 1, 2);
    let triangle3 = new OV.Triangle (0, 2, 3);
    let triangle4 = new OV.Triangle (0, 4, 2);
    triangle2.mat = 0;
    triangle3.mat = 1;
    triangle4.mat = 1;
    mesh2.AddTriangle (triangle2);
    mesh2.AddTriangle (triangle3);
    mesh2.AddTriangle (triangle4);
    model.AddMeshToRootNode (mesh2);

    OV.FinalizeModel (model);
    return model;
}

function Export (model, format, extension, onReady)
{
    let exporter = new OV.Exporter ();
    let settings = new OV.ExporterSettings ();
    exporter.Export (model, settings, format, extension, {
        onSuccess : function (files) {
            onReady (files);
        }
    });
}

describe ('Exporter', function () {
    it ('Exporter Error', function (done) {
        let model = CreateTestModel ();
        let exporter = new OV.Exporter ();
        let settings = new OV.ExporterSettings ();
        exporter.Export (model, settings, OV.FileFormat.Text, 'ext', {
            onError : function () {
                done ();
            }
        });
    });

    it ('Obj Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Text, 'obj', function (result) {
            assert.strictEqual (result.length, 5);

            let mtlFile = result[0];
            assert.strictEqual (mtlFile.GetName (), 'model.mtl');
            assert.strictEqual (mtlFile.GetTextContent (),
            [
                '# exported by https://3dviewer.net',
                'newmtl TestMaterial1',
                'Kd 1 0 0',
                'd 1',
                'Ka 0 0 0',
                'Ks 0.2 0.2 0.2',
                'Ns 0',
                'map_Kd texture1.png',
                'map_Ks texture2.png',
                'bump texture3.png',
                'newmtl TestMaterial2',
                'Kd 0 1 0',
                'd 1',
                'Ka 0 0 0',
                'Ks 0.2 0.2 0.2',
                'Ns 0',
                ''
            ].join ('\n'));
            let objFile = result[1];
            assert.strictEqual (objFile.GetName (), 'model.obj');
            assert.strictEqual (objFile.GetTextContent (),
            [
                '# exported by https://3dviewer.net',
                'mtllib model.mtl',
                'g TestMesh1',
                'v 0 0 1',
                'v 1 0 1',
                'v 0 1 1',
                'vn 0 0 1',
                'usemtl TestMaterial1',
                'f 1//1 2//1 3//1',
                'g TestMesh2',
                'v 0 0 0',
                'v 1 0 0',
                'v 0 1 0',
                'v -1 0 0',
                'v 0 0 1',
                'vn 0 0 1',
                'vn 0 0 1',
                'vn -1 0 0',
                'f 4//2 5//2 6//2',
                'usemtl TestMaterial2',
                'f 4//3 6//3 7//3',
                'f 4//4 8//4 6//4',
                ''
            ].join ('\n'));

            let textureFile1 = result[2];
            assert.strictEqual (textureFile1.GetName (), 'texture1.png');
            assert.strictEqual (textureFile1.GetBufferContent ().byteLength, 1);

            let textureFile2 = result[3];
            assert.strictEqual (textureFile2.GetName (), 'texture2.png');
            assert.strictEqual (textureFile2.GetBufferContent ().byteLength, 2);

            let textureFile3 = result[4];
            assert.strictEqual (textureFile3.GetName (), 'texture3.png');
            assert.strictEqual (textureFile3.GetBufferContent ().byteLength, 3);

            done ();
        });
    });

    it ('Stl Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Text, 'stl', function (result) {
            assert.strictEqual (result.length, 1);

            let stlFile = result[0];
            assert.strictEqual (stlFile.GetName (), 'model.stl');
            assert.strictEqual (stlFile.GetTextContent (),
            [
                'solid Model',
                'facet normal 0 0 1',
                '  outer loop',
                '    vertex 0 0 1',
                '    vertex 1 0 1',
                '    vertex 0 1 1',
                '  endloop',
                'endfacet',
                'facet normal 0 0 1',
                '  outer loop',
                '    vertex 0 0 0',
                '    vertex 1 0 0',
                '    vertex 0 1 0',
                '  endloop',
                'endfacet',
                'facet normal 0 0 1',
                '  outer loop',
                '    vertex 0 0 0',
                '    vertex 0 1 0',
                '    vertex -1 0 0',
                '  endloop',
                'endfacet',
                'facet normal -1 0 0',
                '  outer loop',
                '    vertex 0 0 0',
                '    vertex 0 0 1',
                '    vertex 0 1 0',
                '  endloop',
                'endfacet',
                'endsolid Model',
                ''
            ].join ('\n'));

            done ();
        });
    });

    it ('Stl Binary Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Binary, 'stl', function (result) {
            assert.strictEqual (result.length, 1);

            let stlFile = result[0];
            assert.strictEqual (stlFile.GetName (), 'model.stl');
            assert.strictEqual (stlFile.GetBufferContent ().byteLength, 284);

            let contentBuffer = stlFile.GetBufferContent ();
            let importer = new OV.ImporterStl ();
            importer.Import (stlFile.GetName (), 'stl', contentBuffer, {
                getDefaultMaterialColor () {
                    return new OV.Color (0, 0, 0);
                },
                onSuccess () {
                    let importedModel = importer.GetModel ();
                    assert.strictEqual (importedModel.VertexCount (), 12);
                    assert.strictEqual (importedModel.TriangleCount (), 4);
                    done ();
                }
            });

            done ();
        });
    });

    it ('Off Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Text, 'off', function (result) {
            assert.strictEqual (result.length, 1);

            let offFile = result[0];
            assert.strictEqual (offFile.GetName (), 'model.off');
            assert.strictEqual (offFile.GetTextContent (),
            [
                'OFF',
                '8 4 0',
                '0 0 1',
                '1 0 1',
                '0 1 1',
                '0 0 0',
                '1 0 0',
                '0 1 0',
                '-1 0 0',
                '0 0 1',
                '3 0 1 2',
                '3 3 4 5',
                '3 3 5 6',
                '3 3 7 5',
                ''
            ].join ('\n'));

            done ();
        });
    });

    it ('Ply Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Text, 'ply', function (result) {
            assert.strictEqual (result.length, 1);

            let plyFile = result[0];
            assert.strictEqual (plyFile.GetName (), 'model.ply');
            assert.strictEqual (plyFile.GetTextContent (),
            [
                'ply',
                'format ascii 1.0',
                'element vertex 8',
                'property float x',
                'property float y',
                'property float z',
                'element face 4',
                'property list uchar int vertex_index',
                'end_header',
                '0 0 1',
                '1 0 1',
                '0 1 1',
                '0 0 0',
                '1 0 0',
                '0 1 0',
                '-1 0 0',
                '0 0 1',
                '3 0 1 2',
                '3 3 4 5',
                '3 3 5 6',
                '3 3 7 5',
                ''
            ].join ('\n'));

            done ();
        });
    });

    it ('Ply Binary Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Binary, 'ply', function (result) {
            assert.strictEqual (result.length, 1);

            let plyFile = result[0];
            assert.strictEqual (plyFile.GetName (), 'model.ply');
            assert.strictEqual (plyFile.GetBufferContent ().byteLength, 315);

            let contentBuffer = plyFile.GetBufferContent ();
            let importer = new OV.ImporterPly ();
            importer.Import (plyFile.GetName (), 'ply', contentBuffer, {
                getDefaultMaterialColor () {
                    return new OV.Color (0, 0, 0);
                },
                onSuccess () {
                    let importedModel = importer.GetModel ();
                    assert.strictEqual (importedModel.VertexCount (), 8);
                    assert.strictEqual (importedModel.TriangleCount (), 4);
                    done ();
                }
            });
        });
    });

    it ('Gltf Ascii Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Text, 'gltf', function (result) {
            assert.strictEqual (result.length, 3);

            let gltfFile = result[0];
            let binFile = result[1];
            let textureFile = result[2];
            assert.strictEqual (gltfFile.GetName (), 'model.gltf');
            assert.strictEqual (binFile.GetName (), 'model.bin');

            assert.strictEqual (textureFile.GetName (), 'texture1.png');
            assert.strictEqual (textureFile.GetBufferContent ().byteLength, 1);

            let contentBuffer = gltfFile.GetBufferContent ();
            let importer = new OV.ImporterGltf ();
            importer.Import (gltfFile.GetName (), 'gltf', contentBuffer, {
                getDefaultMaterialColor () {
                    return new OV.Color (0, 0, 0);
                },
                getFileBuffer (filePath) {
                    if (filePath == 'model.bin') {
                        return binFile.GetBufferContent ();
                    }
                    return null;
                },
                getTextureBuffer (filePath) {
                    return null;
                },
                onSuccess () {
                    let importedModel = importer.GetModel ();
                    assert.ok (OV.CheckModel (importedModel));
                    assert.strictEqual (importedModel.MaterialCount (), 2);
                    assert.strictEqual (importedModel.MeshCount (), 2);
                    assert.strictEqual (importedModel.GetMesh (0).GetName (), 'TestMesh1');
                    assert.strictEqual (importedModel.GetMesh (1).GetName (), 'TestMesh2');
                    assert.strictEqual (importedModel.VertexCount (), 12);
                    assert.strictEqual (importedModel.TriangleCount (), 4);
                    done ();
                }
            });
        });
    });

    it ('Gltf Binary Export', function (done) {
        let model = CreateTestModel ();
        Export (model, OV.FileFormat.Binary, 'glb', function (result) {
            assert.strictEqual (result.length, 1);

            let glbFile = result[0];
            assert.strictEqual (glbFile.GetName (), 'model.glb');

            let contentBuffer = glbFile.GetBufferContent ();
            let importer = new OV.ImporterGltf ();
            importer.Import (glbFile.GetName (), 'glb', contentBuffer, {
                getDefaultMaterialColor () {
                    return new OV.Color (0, 0, 0);
                },
                getFileBuffer (filePath) {
                    return null;
                },
                getTextureBuffer (filePath) {
                    return null;
                },
                onSuccess () {
                    let importedModel = importer.GetModel ();
                    assert.ok (OV.CheckModel (importedModel));
                    assert.strictEqual (importedModel.MaterialCount (), 2);
                    assert.strictEqual (importedModel.MeshCount (), 2);
                    assert.strictEqual (importedModel.GetMesh (0).GetName (), 'TestMesh1');
                    assert.strictEqual (importedModel.GetMesh (1).GetName (), 'TestMesh2');
                    assert.strictEqual (importedModel.VertexCount (), 12);
                    assert.strictEqual (importedModel.TriangleCount (), 4);
                    done ();
                }
            });
        });
    });
});

}
