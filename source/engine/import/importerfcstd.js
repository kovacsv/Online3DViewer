import { Direction } from '../geometry/geometry.js';
import { Matrix } from '../geometry/matrix.js';
import { Transformation } from '../geometry/transformation.js';
import { Coord3D } from '../geometry/coord3d.js';
import { Quaternion } from '../geometry/quaternion.js';
import { ImporterBase } from './importerbase.js';
import { GetFileExtension } from '../io/fileutils.js';
import { ConvertThreeGeometryToMesh } from '../threejs/threeutils.js';
import { ArrayBufferToUtf8String, Utf8StringToArrayBuffer } from '../io/bufferutils.js';
import { Node } from '../model/node.js';
import { ColorToMaterialConverter, CreateOcctWorker } from './importerutils.js';
import { RGBAColor } from '../model/color.js';
import { Property, PropertyGroup, PropertyType } from '../model/property.js';
import { Loc } from '../core/localization.js';
import { Mesh } from '../model/mesh.js';
import { Triangle } from '../model/triangle.js';

import * as fflate from 'fflate';

const DocumentInitResult =
{
    Success : 0,
    NoDocumentXml : 1
};

function DefaultPlacement ()
{
    return {
        translation : new Coord3D (0.0, 0.0, 0.0),
        rotation : new Quaternion (0.0, 0.0, 0.0, 1.0)
    };
}

function Base64StringToUint8Array (str)
{
    let base64String = str.replace (/\s/gu, '');
    let binaryString = atob (base64String);
    let buffer = new Uint8Array (binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt (i);
    }
    return buffer;
}

function GetDataViewForBuffer (buffer)
{
    if (buffer instanceof ArrayBuffer) {
        return new DataView (buffer);
    }
    return new DataView (buffer.buffer, buffer.byteOffset, buffer.byteLength);
}

// Parses a PropertyMaterialList binary blob (FreeCAD 1.0+ ShapeAppearance).
// Returns an array of { diffuseColor: RGBAColor, transparency: number }.
function ParseMaterialListBinary (buffer, version)
{
    let view = GetDataViewForBuffer (buffer);
    let offset = 0;
    let count = view.getUint32 (offset, true); offset += 4;
    let materials = [];
    for (let i = 0; i < count; i++) {
        offset += 4; // ambient
        let diffusePacked = view.getUint32 (offset, true); offset += 4;
        offset += 4; // specular
        offset += 4; // emissive
        offset += 4; // shininess (float)
        let transparency = view.getFloat32 (offset, true); offset += 4;
        materials.push ({
            diffuseColor : new RGBAColor (
                (diffusePacked >> 24) & 0xff,
                (diffusePacked >> 16) & 0xff,
                (diffusePacked >> 8) & 0xff,
                255
            ),
            transparency : transparency
        });
    }
    return materials;
}

// Parses a PropertyColorList binary blob (legacy DiffuseColor per-face).
// Returns an array of RGBAColor.
function ParseColorListBinary (buffer)
{
    let view = GetDataViewForBuffer (buffer);
    let offset = 0;
    let count = view.getUint32 (offset, true); offset += 4;
    let colors = [];
    for (let i = 0; i < count; i++) {
        let rgba = view.getUint32 (offset, true); offset += 4;
        colors.push (new RGBAColor (
            (rgba >> 24) & 0xff,
            (rgba >> 16) & 0xff,
            (rgba >> 8) & 0xff,
            255
        ));
    }
    return colors;
}

// Parses a FreeCAD MeshKernel .bms binary blob into an OV Mesh.
// Returns a Mesh or null if the format is not recognized.
function ParseBmsMesh (buffer)
{
    let view = GetDataViewForBuffer (buffer);
    if (view.byteLength < 272) {
        return null;
    }

    let offset = 0;
    let magic = view.getUint32 (offset, true); offset += 4;
    let le = (magic === 0xA0B0C0D0);
    if (!le && magic !== 0xD0C0B0A0) {
        return null;
    }

    offset += 4;   // version
    offset += 256; // info string

    let pointCount = view.getUint32 (offset, le); offset += 4;
    let facetCount = view.getUint32 (offset, le); offset += 4;

    if (view.byteLength < 272 + pointCount * 12 + facetCount * 24) {
        return null;
    }

    let mesh = new Mesh ();
    for (let i = 0; i < pointCount; i++) {
        let x = view.getFloat32 (offset, le); offset += 4;
        let y = view.getFloat32 (offset, le); offset += 4;
        let z = view.getFloat32 (offset, le); offset += 4;
        mesh.AddVertex (new Coord3D (x, y, z));
    }
    for (let i = 0; i < facetCount; i++) {
        let v0 = view.getUint32 (offset, le); offset += 4;
        let v1 = view.getUint32 (offset, le); offset += 4;
        let v2 = view.getUint32 (offset, le); offset += 4;
        offset += 12; // skip 3 neighbour indices
        mesh.AddTriangle (new Triangle (v0, v1, v2));
    }
    return mesh;
}

class FreeCadObject
{
    constructor (name, type)
    {
        this.name = name;
        this.type = type;
        this.shapeName = null;
        this.isVisible = true;
        this.color = null;
        this.transparency = 0.0;
        this.faceColors = null;
        this.fileName = null;
        this.fileContent = null;
        this.inLinkCount = 0;
        this.properties = null;
        this.linkedObjectName = null;
        this.childNames = [];
        this.parentName = null;
        this.placement = null;
        this.scale = new Coord3D (1.0, 1.0, 1.0);
        this.linkTransform = false;
        this.meshIndices = [];
        this.coloredMeshIndices = new Map ();
    }

    IsConvertible ()
    {
        if (this.fileName === null || this.fileContent === null) {
            return false;
        }
        if (!this.isVisible) {
            return false;
        }
        if (this.inLinkCount > 0) {
            return false;
        }
        return true;
    }

    IsShapeObject ()
    {
        return this.fileName !== null && this.fileContent !== null;
    }

    IsLink ()
    {
        return this.linkedObjectName !== null && this.linkedObjectName.length > 0;
    }

    IsGroup ()
    {
        return this.childNames.length > 0;
    }

    IsMeshFile ()
    {
        return this.fileName !== null && GetFileExtension (this.fileName) === 'bms';
    }

    GetDisplayName ()
    {
        if (this.shapeName !== null && this.shapeName.length > 0) {
            return this.shapeName;
        }
        return this.name;
    }

    GetTransformation (includePlacement = true, includeScale = true)
    {
        let placement = DefaultPlacement ();
        if (includePlacement && this.placement !== null) {
            placement = this.placement;
        }

        let scale = new Coord3D (1.0, 1.0, 1.0);
        if (includeScale) {
            scale = this.scale;
        }

        let matrix = new Matrix ().ComposeTRS (placement.translation, placement.rotation, scale);
        let transformation = new Transformation (matrix);
        if (transformation.IsIdentity ()) {
            return null;
        }
        return transformation;
    }
}

class FreeCadDocument
{
    constructor ()
    {
        this.files = null;
        this.properties = null;
        this.objectNames = [];
        this.objectData = new Map ();
    }

    Init (fileContent)
    {
        let fileContentBuffer = new Uint8Array (fileContent);
        this.files = fflate.unzipSync (fileContentBuffer);
        if (!this.LoadDocumentXml ()) {
            return DocumentInitResult.NoDocumentXml;
        }

        this.LoadGuiDocumentXml ();
        return DocumentInitResult.Success;
    }

    GetObjectListToConvert ()
    {
        let objectList = [];
        let objectNames = new Set ();
        let addObject = (object) => {
            if (object === null || !object.IsShapeObject ()) {
                return;
            }
            if (objectNames.has (object.name)) {
                return;
            }
            objectNames.add (object.name);
            objectList.push (object);
        };
        let addLinkedShapes = (object, visited) => {
            if (object === null || visited.has (object.name)) {
                return;
            }
            visited.add (object.name);
            if (object.IsShapeObject ()) {
                addObject (object);
            }
            if (object.IsLink ()) {
                addLinkedShapes (this.GetLinkedObject (object), visited);
            }
            for (let childName of object.childNames) {
                addLinkedShapes (this.GetObject (childName), visited);
            }
        };

        for (let objectName of this.objectNames) {
            let object = this.objectData.get (objectName);
            if (object.IsConvertible ()) {
                addObject (object);
            }
            if (object.isVisible && (object.IsLink () || object.IsGroup ())) {
                addLinkedShapes (object, new Set ());
            }
        }
        return objectList;
    }

    IsSupportedType (type)
    {
        if (type === null) {
            return false;
        }
        if (type.indexOf ('Part2D') !== -1) {
            return false;
        }
        return true;
    }

    IsShapeType (type)
    {
        if (type === null) {
            return false;
        }
        return type.startsWith ('Part::') || type.startsWith ('PartDesign::');
    }

    IsMeshType (type)
    {
        if (type === null) {
            return false;
        }
        return type.startsWith ('Mesh::');
    }

    GetObject (objectName)
    {
        if (this.objectData.has (objectName)) {
            return this.objectData.get (objectName);
        }
        return null;
    }

    GetLinkedObject (object)
    {
        if (!object.IsLink ()) {
            return null;
        }
        return this.GetObject (object.linkedObjectName);
    }

    IsObjectVisible (object)
    {
        if (object === null || !object.isVisible) {
            return false;
        }

        let visited = new Set ();
        let parentName = object.parentName;
        while (parentName !== null) {
            if (visited.has (parentName)) {
                return false;
            }
            visited.add (parentName);

            let parentObject = this.GetObject (parentName);
            if (parentObject === null || !parentObject.isVisible) {
                return false;
            }
            parentName = parentObject.parentName;
        }

        return true;
    }

    HasFile (fileName)
    {
        if (fileName === null || fileName.length === 0) {
            return false;
        }
        return Object.prototype.hasOwnProperty.call (this.files, fileName);
    }

    LoadDocumentXml ()
    {
        let documentXml = this.GetXMLContent ('Document.xml');
        if (documentXml === null) {
            return false;
        }

        this.properties = new PropertyGroup (Loc ('Properties'));
        let documentElements = documentXml.getElementsByTagName ('Document');
        for (let documentElement of documentElements) {
            for (let childNode of documentElement.childNodes) {
                if (childNode.tagName === 'Properties') {
                    this.GetPropertiesFromElement (childNode, this.properties);
                }
            }
        }

        let objectsElements = documentXml.getElementsByTagName ('Objects');
        for (let objectsElement of objectsElements) {
            let objectElements = objectsElement.getElementsByTagName ('Object');
            for (let objectElement of objectElements) {
                let name = objectElement.getAttribute ('name');
                let type = objectElement.getAttribute ('type');
                if (!this.IsSupportedType (type)) {
                    continue;
                }
                let object = new FreeCadObject (name, type);
                this.objectNames.push (name);
                this.objectData.set (name, object);
            }
        }

        let objectDataElements = documentXml.getElementsByTagName ('ObjectData');
        for (let objectDataElement of objectDataElements) {
            let objectElements = objectDataElement.getElementsByTagName ('Object');
            for (let objectElement of objectElements) {
                let name = objectElement.getAttribute ('name');
                if (!this.objectData.has (name)) {
                    continue;
                }

                let object = this.objectData.get (name);
                object.properties = new PropertyGroup (Loc ('Properties'));
                for (let childNode of objectElement.childNodes) {
                    if (childNode.tagName === 'Properties') {
                        this.GetPropertiesFromElement (childNode, object.properties);
                    }
                }

                let propertyElements = objectElement.getElementsByTagName ('Property');
                for (let propertyElement of propertyElements) {
                    let propertyName = propertyElement.getAttribute ('name');
                    if (propertyName === 'Label') {
                        object.shapeName = this.GetFirstChildValue (propertyElement, 'String', 'value');
                    } else if (propertyName === 'Visibility') {
                        let isVisibleString = this.GetFirstChildValue (propertyElement, 'Bool', 'value');
                        object.isVisible = (isVisibleString === 'true');
                    } else if (propertyName === 'Visible') {
                        let isVisibleString = this.GetFirstChildValue (propertyElement, 'Bool', 'value');
                        object.isVisible = (isVisibleString === 'true');
                    } else if (propertyName === 'Shape') {
                        if (!this.IsShapeType (object.type)) {
                            continue;
                        }
                        this.LoadShapeFromProperty (propertyElement, object);
                    } else if (propertyName === 'Mesh') {
                        if (!this.IsMeshType (object.type)) {
                            continue;
                        }
                        this.LoadMeshFromProperty (propertyElement, object);
                    } else if (propertyName === 'Placement') {
                        object.placement = this.GetPlacementFromElement (propertyElement);
                    } else if (propertyName === 'LinkPlacement') {
                        if (object.placement === null) {
                            object.placement = this.GetPlacementFromElement (propertyElement);
                        }
                    } else if (propertyName === 'Scale') {
                        let scaleString = this.GetFirstChildValue (propertyElement, 'Float', 'value');
                        if (scaleString !== null) {
                            let scale = parseFloat (scaleString);
                            object.scale = new Coord3D (scale, scale, scale);
                        }
                    } else if (propertyName === 'ScaleVector') {
                        let scaleVector = this.GetVectorFromElement (propertyElement);
                        if (scaleVector !== null) {
                            object.scale = scaleVector;
                        }
                    } else if (propertyName === 'LinkTransform') {
                        let linkTransformString = this.GetFirstChildValue (propertyElement, 'Bool', 'value');
                        object.linkTransform = (linkTransformString === 'true');
                    } else if (propertyName === 'LinkedObject') {
                        let linkedName = this.GetFirstChildValue (propertyElement, 'XLink', 'name');
                        if (linkedName === null || linkedName.length === 0) {
                            linkedName = this.GetFirstChildValue (propertyElement, 'Link', 'value');
                        }
                        object.linkedObjectName = linkedName;
                    } else if (propertyName === 'Group' || propertyName === 'ElementList') {
                        object.childNames = this.GetLinkListFromElement (propertyElement);
                    }
                }
            }
        }

        for (let objectName of this.objectNames) {
            let object = this.objectData.get (objectName);
            if (object.IsLink () && this.objectData.has (object.linkedObjectName)) {
                let linkedObject = this.objectData.get (object.linkedObjectName);
                linkedObject.inLinkCount += 1;
            }
            for (let childName of object.childNames) {
                if (this.objectData.has (childName)) {
                    let childObject = this.objectData.get (childName);
                    if (childObject.parentName === null) {
                        childObject.parentName = object.name;
                    }
                }
            }
        }

        return true;
    }

    LoadShapeFromProperty (propertyElement, object)
    {
        let partElement = this.GetFirstChildElement (propertyElement, 'Part');
        if (partElement === null) {
            return;
        }

        let fileName = partElement.getAttribute ('file');
        if (fileName !== null && fileName.length > 0) {
            if (!this.HasFile (fileName)) {
                return;
            }

            let extension = GetFileExtension (fileName);
            if (extension !== 'brp' && extension !== 'brep' && extension !== 'bin') {
                return;
            }

            object.fileName = fileName;
            object.fileContent = this.files[fileName];
            return;
        }

        if (partElement.getAttribute ('brep') === '1') {
            object.fileName = object.name + '.Shape.brep';
            object.fileContent = new Uint8Array (Utf8StringToArrayBuffer (partElement.textContent));
        } else if (partElement.getAttribute ('binary') === '1') {
            object.fileName = object.name + '.Shape.bin';
            object.fileContent = Base64StringToUint8Array (partElement.textContent);
        }
    }

    LoadMeshFromProperty (propertyElement, object)
    {
        let meshElement = this.GetFirstChildElement (propertyElement, 'Mesh');
        if (meshElement === null) {
            return;
        }

        let fileName = meshElement.getAttribute ('file');
        if (fileName !== null && fileName.length > 0) {
            if (!this.HasFile (fileName)) {
                return;
            }
            let extension = GetFileExtension (fileName);
            if (extension !== 'bms') {
                return;
            }
            object.fileName = fileName;
            object.fileContent = this.files[fileName];
        }
    }

    LoadGuiDocumentXml ()
    {
        let documentXml = this.GetXMLContent ('GuiDocument.xml');
        if (documentXml === null) {
            return false;
        }

        let viewProviderElements = documentXml.getElementsByTagName ('ViewProvider');
        for (let viewProviderElement of viewProviderElements) {
            let name = viewProviderElement.getAttribute ('name');
            if (!this.objectData.has (name)) {
                continue;
            }

            let object = this.objectData.get (name);
            let propertyElements = viewProviderElement.getElementsByTagName ('Property');
            for (let propertyElement of propertyElements) {
                let propertyName = propertyElement.getAttribute ('name');
                if (propertyName === 'Visibility') {
                    let isVisibleString = this.GetFirstChildValue (propertyElement, 'Bool', 'value');
                    object.isVisible = (isVisibleString === 'true');
                } else if (propertyName === 'ShapeColor') {
                    let colorString = this.GetFirstChildValue (propertyElement, 'PropertyColor', 'value');
                    let rgba = parseInt (colorString, 10);
                    object.color = new RGBAColor (
                        rgba >> 24 & 0xff,
                        rgba >> 16 & 0xff,
                        rgba >> 8 & 0xff,
                        255
                    );
                } else if (propertyName === 'ShapeMaterial') {
                    let colorString = this.GetFirstChildValue (propertyElement, 'PropertyMaterial', 'diffuseColor');
                    if (colorString === null) {
                        continue;
                    }
                    let rgba = parseInt (colorString, 10);
                    object.color = new RGBAColor (
                        rgba >> 24 & 0xff,
                        rgba >> 16 & 0xff,
                        rgba >> 8 & 0xff,
                        rgba & 0xff
                    );
                } else if (propertyName === 'ShapeAppearance') {
                    this.LoadShapeAppearanceFromProperty (propertyElement, object);
                } else if (propertyName === 'DiffuseColor') {
                    this.LoadDiffuseColorFromProperty (propertyElement, object);
                } else if (propertyName === 'Transparency') {
                    let transparencyString = this.GetFirstChildValue (propertyElement, 'Integer', 'value');
                    if (transparencyString !== null) {
                        object.transparency = parseInt (transparencyString, 10) / 100.0;
                    }
                }
            }
        }

        return true;
    }

    LoadShapeAppearanceFromProperty (propertyElement, object)
    {
        let materialListElement = this.GetFirstChildElement (propertyElement, 'MaterialList');
        if (materialListElement === null) {
            return;
        }
        let fileName = materialListElement.getAttribute ('file');
        if (!this.HasFile (fileName)) {
            return;
        }
        let versionStr = materialListElement.getAttribute ('version');
        let version = versionStr !== null ? parseInt (versionStr, 10) : 0;
        let materials = ParseMaterialListBinary (this.files[fileName], version);
        if (materials.length === 0) {
            return;
        }

        // Always set the base color and transparency from the first material.
        let first = materials[0];
        object.color = first.diffuseColor;
        if (first.transparency > 0.0) {
            object.transparency = first.transparency;
        }

        // Store per-face colors if more than one material entry is present.
        if (materials.length > 1) {
            object.faceColors = materials.map ((m) => m.diffuseColor);
        }
    }

    LoadDiffuseColorFromProperty (propertyElement, object)
    {
        let colorListElement = this.GetFirstChildElement (propertyElement, 'ColorList');
        if (colorListElement === null) {
            return;
        }
        let fileName = colorListElement.getAttribute ('file');
        if (!this.HasFile (fileName)) {
            return;
        }
        let colors = ParseColorListBinary (this.files[fileName]);
        if (colors.length === 0) {
            return;
        }
        if (colors.length === 1) {
            object.color = colors[0];
        } else {
            object.faceColors = colors;
        }
    }

    GetPropertiesFromElement (propertiesElement, propertyGroup)
    {
        let propertyElements = propertiesElement.getElementsByTagName ('Property');
        for (let propertyElement of propertyElements) {
            let propertyName = propertyElement.getAttribute ('name');
            let propertyType = propertyElement.getAttribute ('type');

            let property = null;
            if (propertyType === 'App::PropertyBool') {
                let propertyValue = this.GetFirstChildValue (propertyElement, 'String', 'bool');
                if (propertyValue !== null && propertyValue.length > 0) {
                    property = new Property (PropertyType.Boolean, propertyName, propertyValue === 'true');
                }
            } else if (propertyType === 'App::PropertyInteger') {
                let propertyValue = this.GetFirstChildValue (propertyElement, 'Integer', 'value');
                if (propertyValue !== null && propertyValue.length > 0) {
                    property = new Property (PropertyType.Integer, propertyName, parseInt (propertyValue));
                }
            } else if (propertyType === 'App::PropertyString') {
                let propertyValue = this.GetFirstChildValue (propertyElement, 'String', 'value');
                if (propertyValue !== null && propertyValue.length > 0) {
                    property = new Property (PropertyType.Text, propertyName, propertyValue);
                }
            } else if (propertyType === 'App::PropertyUUID') {
                let propertyValue = this.GetFirstChildValue (propertyElement, 'Uuid', 'value');
                if (propertyValue !== null && propertyValue.length > 0) {
                    property = new Property (PropertyType.Text, propertyName, propertyValue);
                }
            } else if (propertyType === 'App::PropertyFloat' || propertyType === 'App::PropertyLength' || propertyType === 'App::PropertyDistance' || propertyType === 'App::PropertyArea' || propertyType === 'App::PropertyVolume') {
                let propertyValue = this.GetFirstChildValue (propertyElement, 'Float', 'value');
                if (propertyValue !== null && propertyValue.length > 0) {
                    property = new Property (PropertyType.Number, propertyName, parseFloat (propertyValue));
                }
            }
            if (property !== null) {
                propertyGroup.AddProperty (property);
            }
        }
    }

    GetPlacementFromElement (propertyElement)
    {
        let placementElements = propertyElement.getElementsByTagName ('PropertyPlacement');
        if (placementElements.length === 0) {
            return null;
        }

        let placementElement = placementElements[0];
        return {
            translation : new Coord3D (
                parseFloat (placementElement.getAttribute ('Px')),
                parseFloat (placementElement.getAttribute ('Py')),
                parseFloat (placementElement.getAttribute ('Pz'))
            ),
            rotation : new Quaternion (
                parseFloat (placementElement.getAttribute ('Q0')),
                parseFloat (placementElement.getAttribute ('Q1')),
                parseFloat (placementElement.getAttribute ('Q2')),
                parseFloat (placementElement.getAttribute ('Q3'))
            )
        };
    }

    GetVectorFromElement (propertyElement)
    {
        let vectorElements = propertyElement.getElementsByTagName ('PropertyVector');
        if (vectorElements.length === 0) {
            return null;
        }

        let vectorElement = vectorElements[0];
        return new Coord3D (
            parseFloat (vectorElement.getAttribute ('valueX')),
            parseFloat (vectorElement.getAttribute ('valueY')),
            parseFloat (vectorElement.getAttribute ('valueZ'))
        );
    }

    GetLinkListFromElement (propertyElement)
    {
        let linkNames = [];
        let addLinkName = (linkName) => {
            if (linkName !== null && linkName.length > 0) {
                linkNames.push (linkName);
            }
        };
        let addLinkNamesFromElement = (element) => {
            if (element.childNodes === null) {
                return;
            }
            for (let i = 0; i < element.childNodes.length; i++) {
                let childNode = element.childNodes.item (i);
                if (childNode.tagName === 'Link') {
                    addLinkName (childNode.getAttribute ('value'));
                } else if (childNode.tagName === 'XLink') {
                    addLinkName (childNode.getAttribute ('name'));
                }
                addLinkNamesFromElement (childNode);
            }
        };
        addLinkNamesFromElement (propertyElement);
        return linkNames;
    }

    GetXMLContent (xmlFileName)
    {
        if (!this.HasFile (xmlFileName)) {
            return null;
        }

        let xmlParser = new DOMParser ();
        let xmlString = ArrayBufferToUtf8String (this.files[xmlFileName]);
        return xmlParser.parseFromString (xmlString, 'text/xml');
    }

    GetFirstChildValue (element, childTagName, childAttribute)
    {
        let childObject = this.GetFirstChildElement (element, childTagName);
        if (childObject === null) {
            return null;
        }
        return childObject.getAttribute (childAttribute);
    }

    GetFirstChildElement (element, childTagName)
    {
        let childObjects = element.getElementsByTagName (childTagName);
        if (childObjects.length === 0) {
            return null;
        }
        return childObjects[0];
    }
}

export class ImporterFcstd extends ImporterBase
{
    constructor ()
    {
        super ();
        this.worker = null;
        this.document = null;
    }

    CanImportExtension (extension)
    {
        return extension === 'fcstd';
    }

    GetUpDirection ()
    {
        return Direction.Z;
    }

	ClearContent ()
	{
        if (this.worker !== null) {
            this.worker.terminate ();
            this.worker = null;
        }
        this.document = null;
	}

    ResetContent ()
    {
        this.worker = null;
        this.document = new FreeCadDocument ();
    }

    ImportContent (fileContent, onFinish)
    {
        let result = this.document.Init (fileContent);
        if (result === DocumentInitResult.NoDocumentXml) {
            this.SetError (Loc ('No Document.xml found.'));
            onFinish ();
            return;
        }

        if (this.document.properties !== null && this.document.properties.PropertyCount () > 0) {
            this.model.AddPropertyGroup (this.document.properties);
        }

        let objectsToConvert = this.document.GetObjectListToConvert ();
        if (objectsToConvert.length === 0) {
            this.SetError (Loc ('No importable object found.'));
            onFinish ();
            return;
        }

        this.ConvertObjects (objectsToConvert, onFinish);
    }

    ConvertObjects (objects, onFinish)
    {
        let colorToMaterial = new ColorToMaterialConverter (this.model);

        // Process Mesh::Feature objects synchronously (bypass OCCT worker).
        let brepObjects = [];
        for (let object of objects) {
            if (object.IsMeshFile ()) {
                this.OnMeshFileConverted (object, colorToMaterial);
            } else {
                brepObjects.push (object);
            }
        }

        if (brepObjects.length === 0) {
            this.AddObjectsToModel (colorToMaterial);
            onFinish ();
            return;
        }

        CreateOcctWorker ().then ((worker) => {
            this.worker = worker;
            this.worker.addEventListener ('message', (ev) => {
                onBrepFileConverted (ev.data);
            });

            this.worker.addEventListener ('error', () => {
                onBrepFileConverted (null);
            });

            let convertedCount = 0;
            let onBrepFileConverted = (resultContent) => {
                if (resultContent !== null) {
                    let currentObject = brepObjects[convertedCount];
                    this.OnFileConverted (currentObject, resultContent, colorToMaterial);
                }
                convertedCount += 1;
                if (convertedCount === brepObjects.length) {
                    this.AddObjectsToModel (colorToMaterial);
                    onFinish ();
                } else {
                    let currentObject = brepObjects[convertedCount];
                    this.worker.postMessage ({
                        format : 'brep',
                        buffer : currentObject.fileContent
                    });
                }
            };

            let currentObject = brepObjects[convertedCount];
            this.worker.postMessage ({
                format : 'brep',
                buffer : currentObject.fileContent
            });
        }).catch (() => {
            this.SetError (Loc ('Failed to load occt-import-js.'));
            onFinish ();
        });
    }

    AddObjectsToModel (colorToMaterial)
    {
        let rootNode = this.model.GetRootNode ();
        for (let objectName of this.document.objectNames) {
            let object = this.document.GetObject (objectName);
            if (object.parentName !== null) {
                continue;
            }
            this.AddObjectToNode (object, rootNode, new Set (), colorToMaterial);
        }
    }

    AddObjectToNode (object, parentNode, visited, colorToMaterial)
    {
        if (object === null || visited.has (object.name)) {
            return;
        }
        if (!this.document.IsObjectVisible (object)) {
            return;
        }

        visited.add (object.name);
        if (object.IsLink ()) {
            this.AddLinkToNode (object, parentNode, visited, colorToMaterial);
        } else if (object.IsGroup ()) {
            this.AddGroupToNode (object, parentNode, visited, colorToMaterial, true, null);
        } else if (object.IsShapeObject () && object.inLinkCount === 0) {
            this.AddShapeToNode (object, parentNode, object.color, true, colorToMaterial);
        }
        visited.delete (object.name);
    }

    AddLinkToNode (linkObject, parentNode, visited, colorToMaterial)
    {
        let linkedObject = this.document.GetLinkedObject (linkObject);
        if (linkedObject === null) {
            return;
        }

        let linkNode = this.CreateObjectNode (linkObject, true);
        parentNode.AddChildNode (linkNode);
        this.AddLinkedObjectToNode (
            linkedObject,
            linkNode,
            visited,
            linkObject,
            colorToMaterial,
            linkObject.linkTransform
        );
        if (linkNode.IsEmpty ()) {
            parentNode.RemoveChildNode (linkNode);
        }
    }

    AddLinkedObjectToNode (object, parentNode, visited, linkObject, colorToMaterial, includeObjectTransformation)
    {
        if (object === null || visited.has (object.name)) {
            return;
        }

        visited.add (object.name);
        if (object.IsLink ()) {
            this.AddLinkToNode (object, parentNode, visited, colorToMaterial);
        } else if (object.IsGroup ()) {
            this.AddGroupToNode (
                object,
                parentNode,
                visited,
                colorToMaterial,
                includeObjectTransformation,
                linkObject
            );
        } else if (object.IsShapeObject ()) {
            let color = linkObject.color;
            if (color === null) {
                color = object.color;
            }
            this.AddShapeToNode (object, parentNode, color, includeObjectTransformation, colorToMaterial);
        }
        visited.delete (object.name);
    }

    AddGroupToNode (object, parentNode, visited, colorToMaterial, includeTransformation, linkObject)
    {
        let groupNode = this.CreateObjectNode (object, includeTransformation);
        parentNode.AddChildNode (groupNode);

        for (let childName of object.childNames) {
            let childObject = this.document.GetObject (childName);
            if (linkObject === null) {
                this.AddObjectToNode (childObject, groupNode, visited, colorToMaterial);
            } else {
                this.AddLinkedObjectToNode (childObject, groupNode, visited, linkObject, colorToMaterial, true);
            }
        }

        if (groupNode.IsEmpty ()) {
            parentNode.RemoveChildNode (groupNode);
        }
    }

    AddShapeToNode (object, parentNode, color, includeTransformation, colorToMaterial)
    {
        if (object.meshIndices.length === 0) {
            return;
        }

        let meshIndices = this.GetMeshIndicesForObject (object, color, colorToMaterial);
        if (includeTransformation) {
            let objectNode = this.CreateObjectNode (object, true);
            for (let meshIndex of meshIndices) {
                objectNode.AddMeshIndex (meshIndex);
            }
            parentNode.AddChildNode (objectNode);
        } else {
            for (let meshIndex of meshIndices) {
                parentNode.AddMeshIndex (meshIndex);
            }
        }
    }

    CreateObjectNode (object, includeTransformation)
    {
        let objectNode = new Node ();
        objectNode.SetName (object.GetDisplayName ());

        let transformation = object.GetTransformation (includeTransformation, true);
        if (transformation !== null) {
            objectNode.SetTransformation (transformation);
        }

        return objectNode;
    }

    GetMeshIndicesForObject (object, color, colorToMaterial)
    {
        if (color === null || this.IsSameColor (color, object.color)) {
            return object.meshIndices;
        }

        let colorKey = this.GetColorKey (color);
        if (object.coloredMeshIndices.has (colorKey)) {
            return object.coloredMeshIndices.get (colorKey);
        }

        let materialIndex = colorToMaterial.GetMaterialIndex (
            color.r,
            color.g,
            color.b,
            color.a
        );
        let meshIndices = [];
        for (let meshIndex of object.meshIndices) {
            let mesh = this.model.GetMesh (meshIndex).Clone ();
            for (let i = 0; i < mesh.TriangleCount (); i++) {
                mesh.GetTriangle (i).SetMaterial (materialIndex);
            }
            meshIndices.push (this.model.AddMesh (mesh));
        }

        object.coloredMeshIndices.set (colorKey, meshIndices);
        return meshIndices;
    }

    IsSameColor (a, b)
    {
        if (a === null || b === null) {
            return false;
        }
        return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
    }

    GetColorKey (color)
    {
        return color.r.toString () + ':' + color.g.toString () + ':' + color.b.toString () + ':' + color.a.toString ();
    }

    OnMeshFileConverted (object, colorToMaterial)
    {
        let mesh = ParseBmsMesh (object.fileContent);
        if (mesh === null || mesh.TriangleCount () === 0) {
            return;
        }

        let materialIndex = null;
        if (object.color !== null) {
            let alpha = Math.round ((1.0 - object.transparency) * 255);
            materialIndex = colorToMaterial.GetMaterialIndex (
                object.color.r,
                object.color.g,
                object.color.b,
                alpha
            );
        }

        if (object.shapeName !== null) {
            mesh.SetName (object.shapeName);
        }

        if (materialIndex !== null) {
            for (let i = 0; i < mesh.TriangleCount (); i++) {
                mesh.GetTriangle (i).SetMaterial (materialIndex);
            }
        }

        if (object.properties !== null && object.properties.PropertyCount () > 0) {
            mesh.AddPropertyGroup (object.properties);
        }

        let meshIndex = this.model.AddMesh (mesh);
        object.meshIndices.push (meshIndex);
    }

    OnFileConverted (object, resultContent, colorToMaterial)
    {
        if (!resultContent.success || resultContent.meshes.length === 0) {
            return;
        }

        let alpha = Math.round ((1.0 - object.transparency) * 255);

        let objectMeshIndex = 1;
        for (let resultMesh of resultContent.meshes) {
            let materialIndex = null;
            if (object.color !== null) {
                materialIndex = colorToMaterial.GetMaterialIndex (
                    object.color.r,
                    object.color.g,
                    object.color.b,
                    alpha
                );
            }
            let mesh = ConvertThreeGeometryToMesh (resultMesh, materialIndex, null);
            if (object.shapeName !== null) {
                let indexString = objectMeshIndex.toString ().padStart (3, '0');
                mesh.SetName (object.shapeName + ' ' + indexString);
            }

            // Apply per-face colors using brep_faces triangle ranges.
            if (object.faceColors !== null && resultMesh.brep_faces !== undefined) {
                this.ApplyFaceColors (mesh, resultMesh.brep_faces, object.faceColors, alpha, colorToMaterial);
            }

            if (object.properties !== null && object.properties.PropertyCount () > 0) {
                mesh.AddPropertyGroup (object.properties);
            }

            let meshIndex = this.model.AddMesh (mesh);
            object.meshIndices.push (meshIndex);
            objectMeshIndex += 1;
        }
    }

    ApplyFaceColors (mesh, brepFaces, faceColors, alpha, colorToMaterial)
    {
        if (brepFaces.length !== faceColors.length) {
            return;
        }
        for (let faceIndex = 0; faceIndex < brepFaces.length; faceIndex++) {
            let face = brepFaces[faceIndex];
            let color = faceColors[faceIndex];
            if (color === null) {
                continue;
            }
            let materialIndex = colorToMaterial.GetMaterialIndex (
                color.r,
                color.g,
                color.b,
                alpha
            );
            for (let t = face.first; t <= face.last; t++) {
                if (t < mesh.TriangleCount ()) {
                    mesh.GetTriangle (t).SetMaterial (materialIndex);
                }
            }
        }
    }
}
