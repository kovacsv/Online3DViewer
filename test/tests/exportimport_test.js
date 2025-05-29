import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

function CreateTestModel ()
{
    function CreateTexture (name, url)
    {
        let texture = new OV.TextureMap ();
        texture.name = name;
        texture.buffer = new ArrayBuffer (1);
        return texture;
    }

    let model = new OV.Model ();

    let phongMaterial = new OV.PhongMaterial ();
    phongMaterial.name = 'Phong Material';
    phongMaterial.color = new OV.RGBColor (0, 0, 0);
    phongMaterial.emissive = new OV.RGBColor (1, 1, 1);
    phongMaterial.opacity = 0.1;
    phongMaterial.transparent = true;
    phongMaterial.alphaTest = 0.2;
    phongMaterial.multiplyDiffuseMap = false;
    phongMaterial.ambient = new OV.RGBColor (2, 2, 2);
    phongMaterial.specular = new OV.RGBColor (3, 3, 3);
    phongMaterial.shininess = 0.3;
    model.AddMaterial (phongMaterial);

    let phongMaterialTexture = new OV.PhongMaterial ();
    phongMaterialTexture.name = 'Phong Material With Texture';
    phongMaterialTexture.color = new OV.RGBColor (0, 0, 0);
    phongMaterialTexture.emissive = new OV.RGBColor (1, 1, 1);
    phongMaterialTexture.opacity = 0.1;
    phongMaterialTexture.transparent = true;
    phongMaterialTexture.alphaTest = 0.2;
    phongMaterialTexture.multiplyDiffuseMap = false;
    phongMaterialTexture.diffuseMap = CreateTexture ('diffuse.png', 'diffuse_url.png');
    phongMaterialTexture.bumpMap = CreateTexture ('bump.png', 'bump_url.png');
    phongMaterialTexture.normalMap = CreateTexture ('normal.png', 'normal_url.png');
    phongMaterialTexture.emissiveMap = CreateTexture ('emissive.png', 'emissive_url.png');
    phongMaterialTexture.ambient = new OV.RGBColor (2, 2, 2);
    phongMaterialTexture.specular = new OV.RGBColor (3, 3, 3);
    phongMaterialTexture.shininess = 0.3;
    phongMaterialTexture.specularMap = CreateTexture ('specular.png', 'specular_url.png');
    model.AddMaterial (phongMaterialTexture);

    let physicalMaterialTexture = new OV.PhysicalMaterial ();
    physicalMaterialTexture.name = 'Phong Material With Texture';
    physicalMaterialTexture.color = new OV.RGBColor (0, 0, 0);
    physicalMaterialTexture.emissive = new OV.RGBColor (1, 1, 1);
    physicalMaterialTexture.opacity = 0.1;
    physicalMaterialTexture.transparent = true;
    physicalMaterialTexture.alphaTest = 0.2;
    physicalMaterialTexture.multiplyDiffuseMap = false;
    physicalMaterialTexture.diffuseMap = CreateTexture ('diffuse.png', 'diffuse_url.png');
    physicalMaterialTexture.bumpMap = CreateTexture ('bump.png', 'bump_url.png');
    physicalMaterialTexture.normalMap = CreateTexture ('normal.png', 'normal_url.png');
    physicalMaterialTexture.emissiveMap = CreateTexture ('emissive.png', 'emissive_url.png');
    physicalMaterialTexture.metalness = 0.3;
    physicalMaterialTexture.roughness = 0.4;
    physicalMaterialTexture.metalnessMap = CreateTexture ('metalness.png', 'metalness_url.png');
    model.AddMaterial (physicalMaterialTexture);

    let rootNode = model.GetRootNode ();
    let node1 = new OV.Node ();
    let node2 = new OV.Node ();
    let node3 = new OV.Node ();
    node1.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (0.0, 0.0, 1.0)));
    node2.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (0.0, 0.0, 2.0)));
    node3.SetTransformation (new OV.Transformation (new OV.Matrix ().CreateTranslation (0.0, 0.0, 3.0)));
    rootNode.AddChildNode (node1);
    rootNode.AddChildNode (node2);
    rootNode.AddChildNode (node3);

    let meshNoMaterial = new OV.Mesh ();
    meshNoMaterial.SetName ('No Material');
    meshNoMaterial.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    meshNoMaterial.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    meshNoMaterial.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    meshNoMaterial.AddTriangle (new OV.Triangle (0, 1, 2));
    rootNode.AddMeshIndex (model.AddMesh (meshNoMaterial));

    let meshWithPhongMaterial = new OV.Mesh ();
    meshWithPhongMaterial.SetName ('Phong Material');
    meshWithPhongMaterial.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    meshWithPhongMaterial.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    meshWithPhongMaterial.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    meshWithPhongMaterial.AddTriangle (new OV.Triangle (0, 1, 2).SetMaterial (0));
    node1.AddMeshIndex (model.AddMesh (meshWithPhongMaterial));

    let meshWithPhongTextureMaterial = new OV.Mesh ();
    meshWithPhongTextureMaterial.SetName ('Phong Material Texture');
    meshWithPhongTextureMaterial.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    meshWithPhongTextureMaterial.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    meshWithPhongTextureMaterial.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    meshWithPhongTextureMaterial.AddTriangle (new OV.Triangle (0, 1, 2).SetMaterial (1));
    node2.AddMeshIndex (model.AddMesh (meshWithPhongTextureMaterial));

    let meshWithPhysicalMaterial = new OV.Mesh ();
    meshWithPhysicalMaterial.SetName ('Physical Material');
    meshWithPhysicalMaterial.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    meshWithPhysicalMaterial.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    meshWithPhysicalMaterial.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    meshWithPhysicalMaterial.AddTriangle (new OV.Triangle (0, 1, 2).SetMaterial (2));
    node3.AddMeshIndex (model.AddMesh (meshWithPhysicalMaterial));

    OV.FinalizeModel (model);
    return model;
}

function CreateTestModelWithLines ()
{
    let model = new OV.Model ();

    let phongMaterial = new OV.PhongMaterial ();
    phongMaterial.name = 'Material';
    phongMaterial.color = new OV.RGBColor (0, 0, 0);
    model.AddMaterial (phongMaterial);

    let meshOnly = new OV.Mesh ();
    meshOnly.SetName ('Mesh Only');
    meshOnly.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    meshOnly.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    meshOnly.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    meshOnly.AddTriangle (new OV.Triangle (0, 1, 2).SetMaterial (0));
    model.AddMeshToRootNode (meshOnly);

    let meshAndLines = new OV.Mesh ();
    meshAndLines.SetName ('Meshes and Lines');
    meshAndLines.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
    meshAndLines.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
    meshAndLines.AddVertex (new OV.Coord3D (0.0, 1.0, 0.0));
    meshAndLines.AddTriangle (new OV.Triangle (0, 1, 2).SetMaterial (0));
    meshAndLines.AddVertex (new OV.Coord3D (0.0, 0.0, 1.0));
    meshAndLines.AddVertex (new OV.Coord3D (1.0, 0.0, 1.0));
    meshAndLines.AddVertex (new OV.Coord3D (0.0, 1.0, 1.0));
    meshAndLines.AddLine (new OV.Line ([3, 4, 5]).SetMaterial (0));
    model.AddMeshToRootNode (meshAndLines);

    OV.FinalizeModel (model);
    return model;
}

function ExportImport (model, format, extension, onReady)
{
    let exporter = new OV.Exporter ();
    let settings = new OV.ExporterSettings ();
    exporter.Export (model, settings, format, extension, {
        onSuccess : function (exportedFiles) {
            let importer = new OV.Importer ();
            let settings = new OV.ImportSettings ();
            let fileObjects = exportedFiles.map (file => new OV.InputFile (file.name, OV.FileSource.File, new FileObject ('', file.name, file.content)));
            importer.ImportFiles (fileObjects, settings, {
                onLoadStart : function () {
                },
                onFileListProgress : (current, total) => {
                },
                onFileLoadProgress : (current, total) => {
                },
                onImportStart : function () {
                },
                onImportSuccess : function (importResult) {
                    onReady (importResult.model)
                },
                onImportError : function (importError) {
                    console.log (importError);
                }
            });
        }
    });
}

function CheckModelBounds (model, model2)
{
    let modelBounds = OV.GetBoundingBox (model);
    let model2Bounds = OV.GetBoundingBox (model2);
    assert.ok (OV.CoordIsEqual3D (modelBounds.min, model2Bounds.min));
    assert.ok (OV.CoordIsEqual3D (modelBounds.max, model2Bounds.max));
}

function CheckSingleMeshModel (model, model2)
{
    assert.strictEqual (model2.MaterialCount (), 1);
    assert.strictEqual (model2.MeshInstanceCount (), 1);
    assert.strictEqual (model.TriangleCount (), model2.TriangleCount ());
    assert.strictEqual (model.LineSegmentCount (), model2.LineSegmentCount ());
    CheckModelBounds (model, model2);
}

function CheckModel (model, model2)
{
    assert.strictEqual (model.MaterialCount (), model2.MaterialCount ());
    assert.strictEqual (model.MeshInstanceCount (), model2.MeshInstanceCount ());
    assert.strictEqual (model.TriangleCount (), model2.TriangleCount ());
    assert.strictEqual (model.LineSegmentCount (), model2.LineSegmentCount ());
    CheckModelBounds (model, model2);
}

describe ('Export-Import Test', function () {
    it ('Export-Import Obj', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Text, 'obj', (model2) => {
            CheckModel (model, model2);
            done ();
        });
    });

    it ('Export-Import Obj with Lines', function (done) {
        let model = CreateTestModelWithLines ();
        ExportImport (model, OV.FileFormat.Text, 'obj', (model2) => {
            CheckModel (model, model2);
            done ();
        });
    });

    it ('Export-Import Stl Ascii', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Text, 'stl', (model2) => {
            CheckSingleMeshModel (model, model2);
            done ();
        });
    });

    it ('Export-Import Stl Binary', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Binary, 'stl', (model2) => {
            CheckSingleMeshModel (model, model2);
            done ();
        });
    });

    it ('Export-Import Ply Ascii', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Text, 'ply', (model2) => {
            CheckSingleMeshModel (model, model2);
            done ();
        });
    });

    it ('Export-Import Ply Binary', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Binary, 'ply', (model2) => {
            CheckSingleMeshModel (model, model2);
            done ();
        });
    });

    it ('Export-Import glTF Ascii', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Text, 'gltf', (model2) => {
            CheckModel (model, model2);
            done ();
        });
    });

    it ('Export-Import glTF Binary', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Binary, 'glb', (model2) => {
            CheckModel (model, model2);
            done ();
        });
    });

    it ('Export-Import Off', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Text, 'off', (model2) => {
            // Single Mesh Model with 2 materials
            assert.strictEqual (model2.MaterialCount (), 2);
            assert.strictEqual (model2.MeshInstanceCount (), 1);
            assert.strictEqual (model.TriangleCount (), model2.TriangleCount ());
            CheckModelBounds (model, model2);
            done ();
        });
    });

    it ('Export-Import Bim', function (done) {
        let model = CreateTestModel ();
        ExportImport (model, OV.FileFormat.Text, 'bim', (model2) => {
            assert.strictEqual (model2.MaterialCount (), 2);
            assert.strictEqual (model.MeshInstanceCount (), model2.MeshInstanceCount ());
            assert.strictEqual (model.TriangleCount (), model2.TriangleCount ());
            CheckModelBounds (model, model2);
            done ();
        });
    });
});

describe ('Export-Import Vertex Colors Test', function () {
    it ('Export-Import Vertex Colors glTF', function (done) {
        let model = new OV.Model ();
        let mesh = new OV.Mesh ();
        mesh.AddVertex (new OV.Coord3D (0.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 0.0, 0.0));
        mesh.AddVertex (new OV.Coord3D (1.0, 1.0, 0.0));
        mesh.AddVertexColor (new OV.RGBColor (1.0, 0.0, 0.0));
        mesh.AddTriangle (new OV.Triangle (0, 1, 2).SetVertexColors (0, 0, 0));
        model.AddMeshToRootNode (mesh);
        OV.FinalizeModel (model);
        ExportImport (model, OV.FileFormat.Binary, 'glb', (model2) => {
            CheckModel (model, model2);
            done ();
        });
    });
});

}
