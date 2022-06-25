import * as assert from 'assert';
import * as OV from '../../source/engine/main.js';

export default function suite ()
{

describe ('Property Test', function () {
    it ('Property group', function() {
        let group = new OV.PropertyGroup ('Group');
        group.AddProperty (new OV.Property (OV.PropertyType.Text, 'name 01', 'value 01'));
        group.AddProperty (new OV.Property (OV.PropertyType.Integer, 'name 02', 2));
        group.AddProperty (new OV.Property (OV.PropertyType.Number, 'name 03', 3.5));
        assert.strictEqual (group.PropertyCount (), 3);
        assert.strictEqual (group.GetProperty (0).name, 'name 01');
        assert.strictEqual (group.GetProperty (0).value, 'value 01');
        assert.strictEqual (group.GetProperty (1).name, 'name 02');
        assert.strictEqual (group.GetProperty (1).value, 2);
        assert.strictEqual (group.GetProperty (2).name, 'name 03');
        assert.strictEqual (group.GetProperty (2).value, 3.5);
    });

    it ('Model properties', function() {
        let model = new OV.Model ();
        let group1 = new OV.PropertyGroup ('Group 01');
        let group2 = new OV.PropertyGroup ('Group 02');
        let group3 = new OV.PropertyGroup ('Group 03');
        group1.AddProperty (new OV.Property (OV.PropertyType.Text, 'name 01', 'value 01'));
        group2.AddProperty (new OV.Property (OV.PropertyType.Integer, 'name 02', 2));
        group3.AddProperty (new OV.Property (OV.PropertyType.Number, 'name 03', 3.5));
        model.AddPropertyGroup (group1);
        model.AddPropertyGroup (group2);
        model.AddPropertyGroup (group3);
        assert.strictEqual (model.PropertyGroupCount (), 3);
        assert.strictEqual (model.GetPropertyGroup (0).name, 'Group 01');
        assert.strictEqual (model.GetPropertyGroup (1).name, 'Group 02');
        assert.strictEqual (model.GetPropertyGroup (2).name, 'Group 03');
        assert.strictEqual (model.GetPropertyGroup (0).GetProperty (0).name, 'name 01');
        assert.strictEqual (model.GetPropertyGroup (0).GetProperty (0).value, 'value 01');
        assert.strictEqual (model.GetPropertyGroup (1).GetProperty (0).name, 'name 02');
        assert.strictEqual (model.GetPropertyGroup (1).GetProperty (0).value, 2);
        assert.strictEqual (model.GetPropertyGroup (2).GetProperty (0).name, 'name 03');
        assert.strictEqual (model.GetPropertyGroup (2).GetProperty (0).value, 3.5);
    });

    it ('Mesh properties', function() {
        let mesh = new OV.Mesh ();
        let group1 = new OV.PropertyGroup ('Group 01');
        let group2 = new OV.PropertyGroup ('Group 02');
        let group3 = new OV.PropertyGroup ('Group 03');
        group1.AddProperty (new OV.Property (OV.PropertyType.Text, 'name 01', 'value 01'));
        group2.AddProperty (new OV.Property (OV.PropertyType.Integer, 'name 02', 2));
        group3.AddProperty (new OV.Property (OV.PropertyType.Number, 'name 03', 3.5));
        mesh.AddPropertyGroup (group1);
        mesh.AddPropertyGroup (group2);
        mesh.AddPropertyGroup (group3);
        assert.strictEqual (mesh.PropertyGroupCount (), 3);
        assert.strictEqual (mesh.GetPropertyGroup (0).name, 'Group 01');
        assert.strictEqual (mesh.GetPropertyGroup (1).name, 'Group 02');
        assert.strictEqual (mesh.GetPropertyGroup (2).name, 'Group 03');
        assert.strictEqual (mesh.GetPropertyGroup (0).GetProperty (0).name, 'name 01');
        assert.strictEqual (mesh.GetPropertyGroup (0).GetProperty (0).value, 'value 01');
        assert.strictEqual (mesh.GetPropertyGroup (1).GetProperty (0).name, 'name 02');
        assert.strictEqual (mesh.GetPropertyGroup (1).GetProperty (0).value, 2);
        assert.strictEqual (mesh.GetPropertyGroup (2).GetProperty (0).name, 'name 03');
        assert.strictEqual (mesh.GetPropertyGroup (2).GetProperty (0).value, 3.5);
    });

    it ('Mesh clone test', function() {
        let mesh = new OV.Mesh ();
        let group1 = new OV.PropertyGroup ('Group 01');
        let group2 = new OV.PropertyGroup ('Group 02');
        let group3 = new OV.PropertyGroup ('Group 03');
        group1.AddProperty (new OV.Property (OV.PropertyType.Text, 'name 01', 'value 01'));
        group2.AddProperty (new OV.Property (OV.PropertyType.Integer, 'name 02', 2));
        group3.AddProperty (new OV.Property (OV.PropertyType.Number, 'name 03', 3.5));
        group3.AddProperty (new OV.Property (OV.PropertyType.Color, 'name 04', new OV.RGBColor (10, 20, 30)));
        mesh.AddPropertyGroup (group1);
        mesh.AddPropertyGroup (group2);
        mesh.AddPropertyGroup (group3);
        let cloned = mesh.Clone ();
        assert.strictEqual (cloned.PropertyGroupCount (), 3);
        assert.strictEqual (cloned.GetPropertyGroup (0).name, 'Group 01');
        assert.strictEqual (cloned.GetPropertyGroup (1).name, 'Group 02');
        assert.strictEqual (cloned.GetPropertyGroup (2).name, 'Group 03');
        assert.strictEqual (cloned.GetPropertyGroup (0).GetProperty (0).name, 'name 01');
        assert.strictEqual (cloned.GetPropertyGroup (0).GetProperty (0).value, 'value 01');
        assert.strictEqual (cloned.GetPropertyGroup (1).GetProperty (0).name, 'name 02');
        assert.strictEqual (cloned.GetPropertyGroup (1).GetProperty (0).value, 2);
        assert.strictEqual (cloned.GetPropertyGroup (2).GetProperty (0).name, 'name 03');
        assert.strictEqual (cloned.GetPropertyGroup (2).GetProperty (0).value, 3.5);
        assert.strictEqual (cloned.GetPropertyGroup (2).GetProperty (1).name, 'name 04');
        assert.strictEqual (
            OV.RGBColorToHexString (cloned.GetPropertyGroup (2).GetProperty (1).value),
            OV.RGBColorToHexString (new OV.RGBColor (10, 20, 30))
        );
    });

    it ('Property to string', function() {
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Text, 'name', 'test')), 'test');
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Integer, 'name', 42)), '42');
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Number, 'name', 3.14)), '3.14');
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Boolean, 'name', true)), 'True');
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Boolean, 'name', false)), 'False');
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Percent, 'name', 0.2)), '20%');
        assert.strictEqual (OV.PropertyToString (new OV.Property (OV.PropertyType.Color, 'color', new OV.RGBColor (10, 20, 20))), '#0a1414');
    });
});

}
