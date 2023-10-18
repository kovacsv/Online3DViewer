import { RunTaskAsync } from '../engine/core/taskrunner.js';
import { Coord3D } from '../engine/geometry/coord3d.js';
import { Matrix } from '../engine/geometry/matrix.js';
import { FileFormat } from '../engine/io/fileutils.js';
import { Exporter } from '../engine/export/exporter.js';
import {
  ExporterModel,
  ExporterSettings,
} from '../engine/export/exportermodel.js';
import { AddDiv, ClearDomElement } from '../engine/viewer/domutils.js';
import { AddSelect } from '../website/utils.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { ShowMessageDialog } from './dialogs.js';
import { DownloadArrayBufferAsFile } from './utils.js';
import { CookieGetStringVal, CookieSetStringVal } from './cookiehandler.js';
import { HandleEvent } from './eventhandler.js';

import * as fflate from 'fflate';
import { findName } from './language.js';

function AddSelectWithCookieSave(
  parentElement,
  cookieKey,
  options,
  defaultSelectedIndex,
  onChange
) {
  let previousOption = CookieGetStringVal(cookieKey, null);
  let previousOptionIndex = options.indexOf(previousOption);
  let selectedIndex =
    previousOptionIndex !== -1 ? previousOptionIndex : defaultSelectedIndex;
  return AddSelect(
    parentElement,
    options,
    selectedIndex,
    (newSelectedIndex) => {
      CookieSetStringVal(cookieKey, options[newSelectedIndex]);
      if (onChange) {
        onChange(newSelectedIndex);
      }
    }
  );
}

class ModelExporterUI {
  constructor(name, format, extension) {
    this.name = name;
    this.format = format;
    this.extension = extension;
    this.visibleOnlySelect = null;
    this.rotationSelect = null;
  }

  GetName() {
    return this.name;
  }

  GenerateParametersUI(parametersDiv) {
    function AddSelectItem(
      parametersDiv,
      name,
      cookieKey,
      values,
      defaultIndex
    ) {
      let parameterRow = AddDiv(parametersDiv, 'ov_dialog_row');
      AddDiv(parameterRow, 'ov_dialog_row_name', name);
      let parameterValueDiv = AddDiv(parameterRow, 'ov_dialog_row_value');
      return AddSelectWithCookieSave(
        parameterValueDiv,
        cookieKey,
        values,
        defaultIndex
      );
    }

    this.visibleOnlySelect = AddSelectItem(
      parametersDiv,
      findName('Scope'),
      'ov_last_scope',
      [findName('EntireModel'), findName('VisibleOnly')],
      1
    );
    this.rotationSelect = AddSelectItem(
      parametersDiv,
      findName('Rotation'),
      'ov_last_rotation',
      [findName('NoRotation'), findName('NinDegM'), findName('NinDegP')],
      0
    );
  }

  ExportModel(model, callbacks) {
    let settings = new ExporterSettings();
    if (this.visibleOnlySelect.selectedIndex === 1) {
      settings.isMeshVisible = (meshInstanceId) => {
        return callbacks.isMeshVisible(meshInstanceId);
      };
    }

    if (this.rotationSelect.selectedIndex === 1) {
      let matrix = new Matrix().CreateRotationAxisAngle(
        new Coord3D(1.0, 0.0, 0.0),
        -Math.PI / 2.0
      );
      settings.transformation.SetMatrix(matrix);
    } else if (this.rotationSelect.selectedIndex === 2) {
      let matrix = new Matrix().CreateRotationAxisAngle(
        new Coord3D(1.0, 0.0, 0.0),
        Math.PI / 2.0
      );
      settings.transformation.SetMatrix(matrix);
    }

    let exporterModel = new ExporterModel(model, settings);
    if (exporterModel.MeshInstanceCount() === 0) {
      ShowMessageDialog(
        findName('ExportFailed'),
        findName('textExportFail'),
        null
      );
      return;
    }

    let progressDialog = new ProgressDialog();
    progressDialog.Init(findName('ExportingModel'));
    progressDialog.Open();

    RunTaskAsync(() => {
      let exporter = new Exporter();
      exporter.Export(model, settings, this.format, this.extension, {
        onError: () => {
          progressDialog.Close();
        },
        onSuccess: (files) => {
          if (files.length === 0) {
            progressDialog.Close();
          } else if (files.length === 1) {
            progressDialog.Close();
            let file = files[0];
            DownloadArrayBufferAsFile(file.GetBufferContent(), file.GetName());
          } else if (files.length > 1) {
            let filesInZip = {};
            for (let file of files) {
              filesInZip[file.name] = new Uint8Array(file.content);
            }
            let zippedContent = fflate.zipSync(filesInZip);
            let zippedBuffer = zippedContent.buffer;
            progressDialog.Close();
            DownloadArrayBufferAsFile(zippedBuffer, 'model.zip');
          }
        },
      });
    });
  }
}

class ExportDialog {
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.selectedExporter = null;
    this.parametersDiv = null;

    this.exporters = [
      new ModelExporterUI(findName('textOBJ'), FileFormat.Text, 'obj'),
      new ModelExporterUI(findName('textSTL'), FileFormat.Text, 'stl'),
      new ModelExporterUI(findName('textBSTL'), FileFormat.Binary, 'stl'),
      new ModelExporterUI(findName('textPLY'), FileFormat.Text, 'ply'),
      new ModelExporterUI(findName('textBPLY'), FileFormat.Binary, 'ply'),
      new ModelExporterUI(findName('textGLTF'), FileFormat.Text, 'gltf'),
      new ModelExporterUI(findName('textBGLTF'), FileFormat.Binary, 'glb'),
      new ModelExporterUI(findName('textOFF'), FileFormat.Text, 'off'),
      new ModelExporterUI(findName('text3DM'), FileFormat.Binary, '3dm'),
      new ModelExporterUI(findName('textBIM'), FileFormat.Text, 'bim'),
    ];
  }

  Open(model, viewer) {
    let mainDialog = new ButtonDialog();
    let contentDiv = mainDialog.Init(findName('Export'), [
      {
        name: findName('Close'),
        subClass: 'outline',
        onClick() {
          mainDialog.Close();
        },
      },
      {
        name: findName('Export'),
        onClick: () => {
          mainDialog.Close();
          this.ExportFormat(model, viewer);
        },
      },
    ]);

    let text = findName('textExportW');
    AddDiv(contentDiv, 'ov_dialog_section', text);

    let formatRow = AddDiv(contentDiv, 'ov_dialog_row');
    this.parametersDiv = AddDiv(contentDiv);
    let formatNames = this.exporters.map((exporter) => exporter.GetName());
    let formatSelector = AddSelectWithCookieSave(
      formatRow,
      'ov_last_export_format',
      formatNames,
      6,
      (selectedIndex) => {
        this.OnFormatSelected(selectedIndex);
      }
    );
    this.OnFormatSelected(formatSelector.selectedIndex);

    mainDialog.Open();
  }

  OnFormatSelected(selectedIndex) {
    ClearDomElement(this.parametersDiv);
    this.selectedExporter = this.exporters[selectedIndex];
    this.selectedExporter.GenerateParametersUI(this.parametersDiv);
  }

  ExportFormat(model, viewer) {
    this.selectedExporter.ExportModel(model, {
      isMeshVisible: (meshInstanceId) => {
        return this.callbacks.isMeshVisible(meshInstanceId);
      },
    });
    HandleEvent('model_exported', this.selectedExporter.GetName());
  }
}

export function ShowExportDialog(model, viewer, callbacks) {
  let exportDialog = new ExportDialog(callbacks);
  exportDialog.Open(model, viewer);
}

export function DownloadModel(importer) {
  let fileList = importer.GetFileList().GetFiles();
  if (fileList.length === 0) {
    return;
  } else if (fileList.length === 1) {
    let file = fileList[0];
    DownloadArrayBufferAsFile(file.content, file.name);
  } else {
    let filesInZip = {};
    for (let file of fileList) {
      filesInZip[file.name] = new Uint8Array(file.content);
    }
    let zippedContent = fflate.zipSync(filesInZip);
    DownloadArrayBufferAsFile(zippedContent.buffer, 'model.zip');
  }
}
