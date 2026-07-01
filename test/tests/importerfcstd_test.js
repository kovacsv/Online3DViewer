import * as assert from 'assert';
import { DOMParser } from '@xmldom/xmldom';
import * as fflate from 'fflate';
import { Coord3D, CoordIsEqual3D } from '../../source/engine/geometry/coord3d.js';
import { ImporterFcstd } from '../../source/engine/import/importerfcstd.js';
import { Mesh } from '../../source/engine/model/mesh.js';
import { Model } from '../../source/engine/model/model.js';
import { RGBAColor } from '../../source/engine/model/color.js';
import { ColorToMaterialConverter } from '../../source/engine/import/importerutils.js';

function MakeXmlNodeListsIterable ()
{
    let document = new DOMParser ().parseFromString ('<root><item/></root>', 'text/xml');
    let nodeLists = [
        document.getElementsByTagName ('item'),
        document.documentElement.childNodes
    ];
    for (let nodeList of nodeLists) {
        let prototype = Object.getPrototypeOf (nodeList);
        if (prototype[Symbol.iterator] !== undefined) {
            continue;
        }
        prototype[Symbol.iterator] = function* () {
            for (let i = 0; i < this.length; i++) {
                yield this.item (i);
            }
        };
    }
}

function CreateLinkedFcstdContent ()
{
    let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="4">
        <Object type="Part::Feature" name="Base" id="1"/>
        <Object type="App::Link" name="LinkA" id="2"/>
        <Object type="App::Link" name="LinkB" id="3"/>
        <Object type="App::DocumentObjectGroup" name="Layer" id="4"/>
    </Objects>
    <ObjectData Count="4">
        <Object name="Base">
            <Properties Count="4">
                <Property name="Label" type="App::PropertyString">
                    <String value="Base"/>
                </Property>
                <Property name="Placement" type="App::PropertyPlacement">
                    <PropertyPlacement Px="1" Py="2" Pz="3" Q0="0" Q1="0" Q2="0" Q3="1"/>
                </Property>
                <Property name="Shape" type="Part::PropertyPartShape">
                    <Part file="Base.Shape.brp"/>
                </Property>
                <Property name="Visibility" type="App::PropertyBool">
                    <Bool value="true"/>
                </Property>
            </Properties>
        </Object>
        <Object name="LinkA">
            <Properties Count="5">
                <Property name="Label" type="App::PropertyString">
                    <String value="LinkA"/>
                </Property>
                <Property name="LinkedObject" type="App::PropertyXLink">
                    <XLink file="" stamp="" name="Base"/>
                </Property>
                <Property name="LinkTransform" type="App::PropertyBool">
                    <Bool value="false"/>
                </Property>
                <Property name="Placement" type="App::PropertyPlacement">
                    <PropertyPlacement Px="10" Py="0" Pz="0" Q0="0" Q1="0" Q2="0" Q3="1"/>
                </Property>
                <Property name="Visibility" type="App::PropertyBool">
                    <Bool value="true"/>
                </Property>
            </Properties>
        </Object>
        <Object name="LinkB">
            <Properties Count="5">
                <Property name="Label" type="App::PropertyString">
                    <String value="LinkB"/>
                </Property>
                <Property name="LinkedObject" type="App::PropertyXLink">
                    <XLink file="" stamp="" name="Base"/>
                </Property>
                <Property name="LinkTransform" type="App::PropertyBool">
                    <Bool value="true"/>
                </Property>
                <Property name="Placement" type="App::PropertyPlacement">
                    <PropertyPlacement Px="20" Py="0" Pz="0" Q0="0" Q1="0" Q2="0" Q3="1"/>
                </Property>
                <Property name="Visibility" type="App::PropertyBool">
                    <Bool value="true"/>
                </Property>
            </Properties>
        </Object>
        <Object name="Layer">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString">
                    <String value="Layer"/>
                </Property>
                <Property name="Group" type="App::PropertyLinkList">
                    <LinkList count="2">
                        <Link value="LinkA"/>
                        <XLink file="" stamp="" name="LinkB"/>
                    </LinkList>
                </Property>
                <Property name="Visibility" type="App::PropertyBool">
                    <Bool value="true"/>
                </Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

    let zipContent = fflate.zipSync ({
        'Document.xml' : fflate.strToU8 (documentXml),
        'Base.Shape.brp' : fflate.strToU8 ('fake brep content')
    });
    return zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);
}

function CreateShapeStorageFcstdContent ()
{
    let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="4">
        <Object type="Part::Feature" name="ExternalBrp" id="1"/>
        <Object type="Part::Feature" name="ExternalBin" id="2"/>
        <Object type="Part::Feature" name="InlineBrep" id="3"/>
        <Object type="Part::Feature" name="InlineBinary" id="4"/>
    </Objects>
    <ObjectData Count="4">
        <Object name="ExternalBrp">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="ExternalBrp"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part file="ExternalBrp.Shape.brp"/></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
        <Object name="ExternalBin">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="ExternalBin"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part file="ExternalBin.Shape.bin"/></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
        <Object name="InlineBrep">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="InlineBrep"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part brep="1">inline brep content</Part></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
        <Object name="InlineBinary">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="InlineBinary"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part binary="1">YmluYXJ5IGJyZXAgY29udGVudA==</Part></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

    let zipContent = fflate.zipSync ({
        'Document.xml' : fflate.strToU8 (documentXml),
        'ExternalBrp.Shape.brp' : fflate.strToU8 ('external brp content'),
        'ExternalBin.Shape.bin' : fflate.strToU8 ('external binary content')
    });
    return zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);
}

function CreateNoVisibilityFcstdContent ()
{
    let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="2">
        <Object type="Part::Feature" name="VisibleByDefault" id="1"/>
        <Object type="Part::Feature" name="ExplicitHidden" id="2"/>
    </Objects>
    <ObjectData Count="2">
        <Object name="VisibleByDefault">
            <Properties Count="2">
                <Property name="Label" type="App::PropertyString"><String value="VisibleByDefault"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part file="VisibleByDefault.Shape.brp"/></Property>
            </Properties>
        </Object>
        <Object name="ExplicitHidden">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="ExplicitHidden"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part file="ExplicitHidden.Shape.brp"/></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="false"/></Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

    let zipContent = fflate.zipSync ({
        'Document.xml' : fflate.strToU8 (documentXml),
        'VisibleByDefault.Shape.brp' : fflate.strToU8 ('visible brep content'),
        'ExplicitHidden.Shape.brp' : fflate.strToU8 ('hidden brep content')
    });
    return zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);
}

// ---------------------------------------------------------------------------
// Binary buffer builders (mirror FreeCAD's binary serialization format)
// ---------------------------------------------------------------------------

function BuildMaterialListBuffer (materials)
{
    // Per-material: ambient(u32) diffuse(u32) specular(u32) emissive(u32) shininess(f32) transparency(f32) = 24 bytes
    let byteLength = 4 + materials.length * 24;
    let buffer = new ArrayBuffer (byteLength);
    let view = new DataView (buffer);
    let offset = 0;
    view.setUint32 (offset, materials.length, true); offset += 4;
    for (let m of materials) {
        let packed = (((m.r & 0xff) << 24) | ((m.g & 0xff) << 16) | ((m.b & 0xff) << 8) | 0xff) >>> 0;
        view.setUint32 (offset, 0, true); offset += 4; // ambient
        view.setUint32 (offset, packed, true); offset += 4; // diffuse
        view.setUint32 (offset, 0, true); offset += 4; // specular
        view.setUint32 (offset, 0, true); offset += 4; // emissive
        view.setFloat32 (offset, 0.5, true); offset += 4; // shininess
        view.setFloat32 (offset, m.transparency || 0.0, true); offset += 4;
    }
    return new Uint8Array (buffer);
}

function BuildColorListBuffer (colors)
{
    let byteLength = 4 + colors.length * 4;
    let buffer = new ArrayBuffer (byteLength);
    let view = new DataView (buffer);
    view.setUint32 (0, colors.length, true);
    for (let i = 0; i < colors.length; i++) {
        let c = colors[i];
        let packed = (((c.r & 0xff) << 24) | ((c.g & 0xff) << 16) | ((c.b & 0xff) << 8) | 0xff) >>> 0;
        view.setUint32 (4 + i * 4, packed, true);
    }
    return new Uint8Array (buffer);
}

function BuildBmsBuffer (vertices, triangles)
{
    let byteLength = 8 + 256 + 8 + vertices.length * 12 + triangles.length * 24 + 24;
    let buffer = new ArrayBuffer (byteLength);
    let view = new DataView (buffer);
    let offset = 0;
    view.setUint32 (offset, 0xA0B0C0D0, true); offset += 4; // magic LE
    view.setUint32 (offset, 0x010000, true); offset += 4;   // version
    offset += 256; // info string (zeroed)
    view.setUint32 (offset, vertices.length, true); offset += 4;
    view.setUint32 (offset, triangles.length, true); offset += 4;
    for (let v of vertices) {
        view.setFloat32 (offset, v.x, true); offset += 4;
        view.setFloat32 (offset, v.y, true); offset += 4;
        view.setFloat32 (offset, v.z, true); offset += 4;
    }
    for (let t of triangles) {
        view.setUint32 (offset, t.v0, true); offset += 4;
        view.setUint32 (offset, t.v1, true); offset += 4;
        view.setUint32 (offset, t.v2, true); offset += 4;
        view.setUint32 (offset, 0xffffffff, true); offset += 4; // neighbours
        view.setUint32 (offset, 0xffffffff, true); offset += 4;
        view.setUint32 (offset, 0xffffffff, true); offset += 4;
    }
    // bounding box: 6 floats, left as zero
    return new Uint8Array (buffer);
}

// ---------------------------------------------------------------------------
// FCStd fixture builders for appearance / mesh feature tests
// ---------------------------------------------------------------------------

function CreateShapeAppearanceFcstdContent (materials, transparencyPercent)
{
    let guiTransparencyProp = '';
    if (transparencyPercent !== undefined) {
        guiTransparencyProp = `
                <Property name="Transparency" type="App::PropertyInteger">
                    <Integer value="${transparencyPercent}"/>
                </Property>`;
    }

    let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="1">
        <Object type="Part::Feature" name="Box" id="1"/>
    </Objects>
    <ObjectData Count="1">
        <Object name="Box">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="Box"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part file="Box.Shape.brp"/></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

    let guiDocumentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <ViewProviderData Count="1">
        <ViewProvider name="Box" expanded="0">
            <Properties Count="2">
                <Property name="ShapeAppearance" type="Part::PropertyMaterialList">
                    <MaterialList file="Box.ShapeAppearance.MaterialList" version="3"/>
                </Property>${guiTransparencyProp}
            </Properties>
        </ViewProvider>
    </ViewProviderData>
</Document>`;

    let materialListBuffer = BuildMaterialListBuffer (materials);
    let zipContent = fflate.zipSync ({
        'Document.xml'    : fflate.strToU8 (documentXml),
        'GuiDocument.xml' : fflate.strToU8 (guiDocumentXml),
        'Box.Shape.brp'   : fflate.strToU8 ('fake brep'),
        'Box.ShapeAppearance.MaterialList' : materialListBuffer
    });
    return zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);
}

function CreateDiffuseColorFcstdContent (colors)
{
    let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="1">
        <Object type="Part::Feature" name="Box" id="1"/>
    </Objects>
    <ObjectData Count="1">
        <Object name="Box">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="Box"/></Property>
                <Property name="Shape" type="Part::PropertyPartShape"><Part file="Box.Shape.brp"/></Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

    let guiDocumentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <ViewProviderData Count="1">
        <ViewProvider name="Box" expanded="0">
            <Properties Count="1">
                <Property name="DiffuseColor" type="App::PropertyColorList">
                    <ColorList file="Box.DiffuseColor.ColorList"/>
                </Property>
            </Properties>
        </ViewProvider>
    </ViewProviderData>
</Document>`;

    let colorListBuffer = BuildColorListBuffer (colors);
    let zipContent = fflate.zipSync ({
        'Document.xml'    : fflate.strToU8 (documentXml),
        'GuiDocument.xml' : fflate.strToU8 (guiDocumentXml),
        'Box.Shape.brp'   : fflate.strToU8 ('fake brep'),
        'Box.DiffuseColor.ColorList' : colorListBuffer
    });
    return zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);
}

function CreateMeshFeatureFcstdContent (vertices, triangles)
{
    let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="1">
        <Object type="Mesh::Feature" name="MeshBox" id="1"/>
    </Objects>
    <ObjectData Count="1">
        <Object name="MeshBox">
            <Properties Count="3">
                <Property name="Label" type="App::PropertyString"><String value="MeshBox"/></Property>
                <Property name="Mesh" type="Mesh::PropertyMeshKernel">
                    <Mesh file="MeshKernel.bms"/>
                </Property>
                <Property name="Visibility" type="App::PropertyBool"><Bool value="true"/></Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

    let bmsBuffer = BuildBmsBuffer (vertices, triangles);
    let zipContent = fflate.zipSync ({
        'Document.xml' : fflate.strToU8 (documentXml),
        'MeshKernel.bms' : bmsBuffer
    });
    return zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);
}

function ImportAndCaptureObjects (fcstdContent)
{
    global.DOMParser = DOMParser;
    MakeXmlNodeListsIterable ();

    let importer = new ImporterFcstd ();
    importer.model = new Model ();
    importer.error = false;
    importer.ResetContent ();

    let capturedObjects = null;
    importer.ConvertObjects = function (objects, onFinish) {
        capturedObjects = objects;
        onFinish ();
    };

    importer.ImportContent (fcstdContent, () => {});
    return { importer, capturedObjects };
}

export default function suite ()
{

describe ('FCStd Importer', function () {
    it ('selects supported shape storage forms', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        let objectsToConvert = null;
        importer.ConvertObjects = function (objects, onFinish) {
            objectsToConvert = objects;
            onFinish ();
        };

        importer.ImportContent (CreateShapeStorageFcstdContent (), () => {});

        assert.ok (!importer.WasError ());
        assert.deepStrictEqual (
            objectsToConvert.map ((object) => object.name),
            ['ExternalBrp', 'ExternalBin', 'InlineBrep', 'InlineBinary']
        );
        assert.deepStrictEqual (
            objectsToConvert.map ((object) => object.fileName),
            [
                'ExternalBrp.Shape.brp',
                'ExternalBin.Shape.bin',
                'InlineBrep.Shape.brep',
                'InlineBinary.Shape.bin'
            ]
        );

        let decoder = new TextDecoder ('utf-8');
        assert.strictEqual (decoder.decode (objectsToConvert[0].fileContent), 'external brp content');
        assert.strictEqual (decoder.decode (objectsToConvert[1].fileContent), 'external binary content');
        assert.strictEqual (decoder.decode (objectsToConvert[2].fileContent), 'inline brep content');
        assert.strictEqual (decoder.decode (objectsToConvert[3].fileContent), 'binary brep content');
    });

    it ('imports objects without visibility metadata as visible', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        let objectsToConvert = null;
        importer.ConvertObjects = function (objects, onFinish) {
            objectsToConvert = objects;
            onFinish ();
        };

        importer.ImportContent (CreateNoVisibilityFcstdContent (), () => {});

        assert.ok (!importer.WasError ());
        assert.deepStrictEqual (objectsToConvert.map ((object) => object.name), ['VisibleByDefault']);
        assert.strictEqual (new TextDecoder ('utf-8').decode (objectsToConvert[0].fileContent), 'visible brep content');
    });

    it ('imports linked object instances with placements', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        let objectsToConvert = null;
        importer.ConvertObjects = function (objects, onFinish) {
            objectsToConvert = objects;
            for (let object of objects) {
                let mesh = new Mesh ();
                mesh.SetName (object.name);
                object.meshIndices.push (this.model.AddMesh (mesh));
            }
            this.AddObjectsToModel ({
                GetMaterialIndex : () => 0
            });
            onFinish ();
        };

        let finished = false;
        importer.ImportContent (CreateLinkedFcstdContent (), () => {
            finished = true;
        });

        assert.ok (finished);
        assert.ok (!importer.WasError ());
        assert.deepStrictEqual (objectsToConvert.map ((object) => object.name), ['Base']);
        assert.strictEqual (importer.model.MeshCount (), 1);
        assert.strictEqual (importer.model.MeshInstanceCount (), 2);

        let rootNode = importer.model.GetRootNode ();
        assert.strictEqual (rootNode.ChildNodeCount (), 1);

        let layerNode = rootNode.GetChildNode (0);
        assert.strictEqual (layerNode.GetName (), 'Layer');
        assert.strictEqual (layerNode.ChildNodeCount (), 2);

        let linkANode = layerNode.GetChildNode (0);
        assert.strictEqual (linkANode.GetName (), 'LinkA');
        assert.strictEqual (linkANode.MeshIndexCount (), 1);
        assert.strictEqual (linkANode.ChildNodeCount (), 0);
        assert.ok (CoordIsEqual3D (
            linkANode.GetWorldTransformation ().TransformCoord3D (new Coord3D (0.0, 0.0, 0.0)),
            new Coord3D (10.0, 0.0, 0.0)
        ));

        let linkBNode = layerNode.GetChildNode (1);
        assert.strictEqual (linkBNode.GetName (), 'LinkB');
        assert.strictEqual (linkBNode.MeshIndexCount (), 0);
        assert.strictEqual (linkBNode.ChildNodeCount (), 1);

        let linkedBaseNode = linkBNode.GetChildNode (0);
        assert.strictEqual (linkedBaseNode.GetName (), 'Base');
        assert.strictEqual (linkedBaseNode.MeshIndexCount (), 1);
        assert.ok (CoordIsEqual3D (
            linkedBaseNode.GetWorldTransformation ().TransformCoord3D (new Coord3D (0.0, 0.0, 0.0)),
            new Coord3D (21.0, 2.0, 3.0)
        ));
    });
});

describe ('FCStd ShapeAppearance (FreeCAD 1.0 colors)', function () {
    it ('reads single-material ShapeAppearance as object color', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateShapeAppearanceFcstdContent ([{ r : 255, g : 0, b : 0 }])
        );
        assert.ok (capturedObjects !== null && capturedObjects.length === 1);
        let obj = capturedObjects[0];
        assert.ok (obj.color !== null, 'color should be set from ShapeAppearance');
        assert.strictEqual (obj.color.r, 255);
        assert.strictEqual (obj.color.g, 0);
        assert.strictEqual (obj.color.b, 0);
        assert.strictEqual (obj.faceColors, null, 'single material should not produce faceColors');
    });

    it ('reads multi-material ShapeAppearance as per-face colors', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateShapeAppearanceFcstdContent ([
                { r : 255, g : 0, b : 0 },
                { r : 0, g : 255, b : 0 },
                { r : 0, g : 0, b : 255 }
            ])
        );
        let obj = capturedObjects[0];
        assert.ok (obj.color !== null, 'base color should be set from first material');
        assert.strictEqual (obj.color.r, 255);
        assert.ok (obj.faceColors !== null, 'multi-material should set faceColors');
        assert.strictEqual (obj.faceColors.length, 3);
        assert.strictEqual (obj.faceColors[1].g, 255);
        assert.strictEqual (obj.faceColors[2].b, 255);
    });

    it ('reads transparency from ShapeAppearance material', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateShapeAppearanceFcstdContent ([{ r : 200, g : 100, b : 50, transparency : 0.35 }])
        );
        let obj = capturedObjects[0];
        assert.ok (Math.abs (obj.transparency - 0.35) < 0.01, 'transparency should be ~0.35');
    });
});

describe ('FCStd Transparency property', function () {
    it ('reads Transparency integer (0-100) into object.transparency (0-1)', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateShapeAppearanceFcstdContent ([{ r : 100, g : 100, b : 100 }], 35)
        );
        let obj = capturedObjects[0];
        assert.ok (Math.abs (obj.transparency - 0.35) < 0.01, 'Transparency=35 should map to 0.35');
    });

    it ('maps Transparency=0 to fully opaque (alpha 255)', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateShapeAppearanceFcstdContent ([{ r : 100, g : 100, b : 100 }], 0)
        );
        let obj = capturedObjects[0];
        assert.strictEqual (obj.transparency, 0.0);
    });
});

describe ('FCStd DiffuseColor (legacy per-face)', function () {
    it ('reads single DiffuseColor entry as object color', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateDiffuseColorFcstdContent ([{ r : 0, g : 128, b : 255 }])
        );
        let obj = capturedObjects[0];
        assert.ok (obj.color !== null);
        assert.strictEqual (obj.color.r, 0);
        assert.strictEqual (obj.color.g, 128);
        assert.strictEqual (obj.color.b, 255);
        assert.strictEqual (obj.faceColors, null);
    });

    it ('reads multi-entry DiffuseColor as per-face colors', function () {
        let { capturedObjects } = ImportAndCaptureObjects (
            CreateDiffuseColorFcstdContent ([
                { r : 255, g : 0,   b : 0 },
                { r : 255, g : 0,   b : 0 },
                { r : 255, g : 0,   b : 0 },
                { r : 255, g : 0,   b : 0 },
                { r : 255, g : 255, b : 0 },
                { r : 255, g : 255, b : 0 }
            ])
        );
        let obj = capturedObjects[0];
        assert.ok (obj.faceColors !== null, 'should have per-face colors');
        assert.strictEqual (obj.faceColors.length, 6);
        assert.strictEqual (obj.faceColors[0].r, 255);
        assert.strictEqual (obj.faceColors[0].g, 0);
        assert.strictEqual (obj.faceColors[4].r, 255);
        assert.strictEqual (obj.faceColors[4].g, 255);
    });
});

describe ('FCStd per-face color application (ApplyFaceColors)', function () {
    it ('assigns distinct materials to triangle ranges from brep_faces', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        let colorToMaterial = new ColorToMaterialConverter (importer.model);

        let fakeObject = {
            color     : new RGBAColor (200, 100, 50, 255),
            transparency : 0.0,
            faceColors   : [
                new RGBAColor (255, 0,   0, 255),
                new RGBAColor (0,   255, 0, 255)
            ],
            shapeName  : 'TestShape',
            properties : null,
            meshIndices : []
        };

        let fakeGeometry = {
            attributes : {
                position : {
                    array    : [0,0,0, 1,0,0, 0,1,0, 1,1,0],
                    itemSize : 3
                }
            },
            index : { array : [0,1,2, 1,3,2] }
        };

        let fakeResult = {
            success : true,
            meshes  : [{
                ...fakeGeometry,
                brep_faces : [
                    { first : 0, last : 0 },
                    { first : 1, last : 1 }
                ]
            }]
        };

        importer.OnFileConverted (fakeObject, fakeResult, colorToMaterial);

        assert.strictEqual (fakeObject.meshIndices.length, 1);
        let mesh = importer.model.GetMesh (fakeObject.meshIndices[0]);
        assert.strictEqual (mesh.TriangleCount (), 2);

        let mat0 = mesh.GetTriangle (0).mat;
        let mat1 = mesh.GetTriangle (1).mat;
        assert.notStrictEqual (mat0, mat1, 'different faces should have different materials');

        let material0 = importer.model.GetMaterial (mat0);
        assert.strictEqual (material0.color.r, 255);
        assert.strictEqual (material0.color.g, 0);

        let material1 = importer.model.GetMaterial (mat1);
        assert.strictEqual (material1.color.r, 0);
        assert.strictEqual (material1.color.g, 255);
    });

    it ('falls back gracefully when brep_faces count does not match faceColors count', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        let colorToMaterial = new ColorToMaterialConverter (importer.model);

        let fakeObject = {
            color        : new RGBAColor (200, 100, 50, 255),
            transparency : 0.0,
            faceColors   : [new RGBAColor (255, 0, 0, 255)],
            shapeName    : null,
            properties   : null,
            meshIndices  : []
        };

        let fakeGeometry = {
            attributes : {
                position : { array : [0,0,0, 1,0,0, 0,1,0], itemSize : 3 }
            },
            index : { array : [0, 1, 2] }
        };

        let fakeResult = {
            success : true,
            meshes  : [{
                ...fakeGeometry,
                brep_faces : [
                    { first : 0, last : 0 },
                    { first : 1, last : 1 } // 2 faces but only 1 faceColor
                ]
            }]
        };

        assert.doesNotThrow (() => {
            importer.OnFileConverted (fakeObject, fakeResult, colorToMaterial);
        });
        assert.strictEqual (fakeObject.meshIndices.length, 1);
    });
});

describe ('FCStd Mesh::Feature (.bms)', function () {
    it ('parses BMS binary format and creates mesh with correct geometry', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let vertices = [
            { x : 0.0, y : 0.0, z : 0.0 },
            { x : 1.0, y : 0.0, z : 0.0 },
            { x : 0.0, y : 1.0, z : 0.0 },
            { x : 1.0, y : 1.0, z : 0.0 }
        ];
        let triangles = [
            { v0 : 0, v1 : 1, v2 : 2 },
            { v0 : 1, v1 : 3, v2 : 2 }
        ];

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        let finished = false;
        importer.ImportContent (CreateMeshFeatureFcstdContent (vertices, triangles), () => {
            finished = true;
        });

        assert.ok (finished, 'import should complete synchronously (no OCCT worker needed)');
        assert.ok (!importer.WasError ());
        assert.strictEqual (importer.model.MeshCount (), 1);

        let mesh = importer.model.GetMesh (0);
        assert.strictEqual (mesh.VertexCount (), 4);
        assert.strictEqual (mesh.TriangleCount (), 2);

        let v0 = mesh.GetVertex (0);
        assert.ok (Math.abs (v0.x - 0.0) < 1e-5);
        assert.ok (Math.abs (v0.y - 0.0) < 1e-5);

        let v1 = mesh.GetVertex (1);
        assert.ok (Math.abs (v1.x - 1.0) < 1e-5);
    });

    it ('ignores .bms files with wrong magic number', function () {
        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let badBmsBuffer = new Uint8Array (300); // all zeros → wrong magic

        let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="1">
        <Object type="Mesh::Feature" name="MeshBox" id="1"/>
    </Objects>
    <ObjectData Count="1">
        <Object name="MeshBox">
            <Properties Count="2">
                <Property name="Label" type="App::PropertyString"><String value="MeshBox"/></Property>
                <Property name="Mesh" type="Mesh::PropertyMeshKernel">
                    <Mesh file="MeshKernel.bms"/>
                </Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

        let zipContent = fflate.zipSync ({
            'Document.xml'   : fflate.strToU8 (documentXml),
            'MeshKernel.bms' : badBmsBuffer
        });
        let fileContent = zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();

        assert.doesNotThrow (() => {
            importer.ImportContent (fileContent, () => {});
        });
        assert.strictEqual (importer.model.MeshCount (), 0, 'bad BMS should produce no meshes');
    });

    it ('detects big-endian BMS magic and auto-detects endianness', function () {
        let vertices = [
            { x : 0.0, y : 0.0, z : 0.0 },
            { x : 1.0, y : 0.0, z : 0.0 },
            { x : 0.0, y : 1.0, z : 0.0 }
        ];
        let triangles = [{ v0 : 0, v1 : 1, v2 : 2 }];

        // Build a BE version of the same BMS data.
        // FreeCAD writes 0xA0B0C0D0 in BE byte order (memory: A0 B0 C0 D0).
        // A LE reader sees 0xD0C0B0A0, which is the sentinel that triggers BE mode.
        let byteLength = 8 + 256 + 8 + vertices.length * 12 + triangles.length * 24 + 24;
        let buffer = new ArrayBuffer (byteLength);
        let view = new DataView (buffer);
        let offset = 0;
        view.setUint32 (offset, 0xA0B0C0D0, false); offset += 4; // magic stored as BE → LE reader gets 0xD0C0B0A0
        view.setUint32 (offset, 0x010000, false); offset += 4;
        offset += 256;
        view.setUint32 (offset, vertices.length, false); offset += 4;
        view.setUint32 (offset, triangles.length, false); offset += 4;
        for (let v of vertices) {
            // floats: in BE layout setFloat32 with false
            view.setFloat32 (offset, v.x, false); offset += 4;
            view.setFloat32 (offset, v.y, false); offset += 4;
            view.setFloat32 (offset, v.z, false); offset += 4;
        }
        for (let t of triangles) {
            view.setUint32 (offset, t.v0, false); offset += 4;
            view.setUint32 (offset, t.v1, false); offset += 4;
            view.setUint32 (offset, t.v2, false); offset += 4;
            view.setUint32 (offset, 0xffffffff, false); offset += 4;
            view.setUint32 (offset, 0xffffffff, false); offset += 4;
            view.setUint32 (offset, 0xffffffff, false); offset += 4;
        }
        let bmsBuffer = new Uint8Array (buffer);

        let documentXml = `<?xml version='1.0' encoding='utf-8'?>
<Document SchemaVersion="4">
    <Properties Count="0"/>
    <Objects Count="1">
        <Object type="Mesh::Feature" name="BE" id="1"/>
    </Objects>
    <ObjectData Count="1">
        <Object name="BE">
            <Properties Count="2">
                <Property name="Label" type="App::PropertyString"><String value="BE"/></Property>
                <Property name="Mesh" type="Mesh::PropertyMeshKernel">
                    <Mesh file="MeshKernel.bms"/>
                </Property>
            </Properties>
        </Object>
    </ObjectData>
</Document>`;

        global.DOMParser = DOMParser;
        MakeXmlNodeListsIterable ();

        let zipContent = fflate.zipSync ({
            'Document.xml'   : fflate.strToU8 (documentXml),
            'MeshKernel.bms' : bmsBuffer
        });
        let fileContent = zipContent.buffer.slice (zipContent.byteOffset, zipContent.byteOffset + zipContent.byteLength);

        let importer = new ImporterFcstd ();
        importer.model = new Model ();
        importer.error = false;
        importer.ResetContent ();
        importer.ImportContent (fileContent, () => {});

        assert.strictEqual (importer.model.MeshCount (), 1);
        let mesh = importer.model.GetMesh (0);
        assert.strictEqual (mesh.VertexCount (), 3);
        assert.strictEqual (mesh.TriangleCount (), 1);
    });
});

}
