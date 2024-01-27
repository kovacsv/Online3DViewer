import { AddDiv } from '../engine/viewer/domutils.js';
import { ThreeModelLoader } from '../engine/threejs/threemodelloader.js';
import { ShowMessageDialog } from './dialogs.js';
import { ButtonDialog, ProgressDialog } from './dialog.js';
import { AddSvgIconElement } from './utils.js';
import { ImportErrorCode } from '../engine/import/importer.js';
import { Loc } from '../engine/core/localization.js';

export class ThreeModelLoaderUI
{
    constructor ()
    {
        this.modelLoader = new ThreeModelLoader ();
        this.modalDialog = null;
    }

    LoadModel (inputFiles, settings, callbacks)
    {
        if (this.modelLoader.InProgress ()) {
            return;
        }

        let progressDialog = null;
        this.modelLoader.LoadModel (inputFiles, settings, {
            onLoadStart : () => {
                this.CloseDialogIfOpen ();
                callbacks.onStart ();
                progressDialog = new ProgressDialog ();
                progressDialog.Init (Loc ('Loading Model'));
                progressDialog.Open ();
            },
            onFileListProgress : (current, total) => {
            },
            onFileLoadProgress : (current, total) => {
            },
            onSelectMainFile : (fileNames, selectFile) => {
                progressDialog.Close ();
                this.modalDialog = this.ShowFileSelectorDialog (fileNames, (index) => {
                    progressDialog.Open ();
                    selectFile (index);
                });
            },
            onImportStart : () => {
                progressDialog.SetText (Loc ('Importing Model'));
            },
            onVisualizationStart : () => {
                progressDialog.SetText (Loc ('Visualizing Model'));
            },
            onModelFinished : (importResult, threeObject) => {
                progressDialog.Close ();
                callbacks.onFinish (importResult, threeObject);
            },
            onTextureLoaded : () => {
                callbacks.onRender ();
            },
            onLoadError : (importError) => {
                progressDialog.Close ();
                callbacks.onError (importError);
                this.modalDialog = this.ShowErrorDialog (importError);
            },
        });
    }

    GetModelLoader ()
    {
        return this.modelLoader;
    }

    GetImporter ()
    {
        return this.modelLoader.GetImporter ();
    }

    ShowErrorDialog (importError)
    {
        if (importError.code === ImportErrorCode.NoImportableFile) {
            return ShowMessageDialog (
                Loc ('Something went wrong'),
                Loc ('No importable file found.'),
                null
            );
        } else if (importError.code === ImportErrorCode.FailedToLoadFile) {
            return ShowMessageDialog (
                Loc ('Something went wrong'),
                Loc ('Failed to load file for import.'),
                Loc ('The remote server refused to fulfill the request. Check if the url is correct, and make sure that CORS requests are allowed on the remote server.')
            );
        } else if (importError.code === ImportErrorCode.ImportFailed) {
            return ShowMessageDialog (
                Loc ('Something went wrong'),
                Loc ('Failed to import model.'),
                importError.message
            );
        } else {
            return ShowMessageDialog (
                Loc ('Something went wrong'),
                Loc ('Unknown error.'),
                null
            );
        }
    }

    ShowFileSelectorDialog (fileNames, onSelect)
    {
        let dialog = new ButtonDialog ();
        let contentDiv = dialog.Init (Loc ('Select Model'), [
            {
                name : Loc ('Cancel'),
                subClass : 'outline',
                onClick () {
                    dialog.Close ();
                }
            }
        ]);
        dialog.SetCloseHandler (() => {
            onSelect (null);
        });

        let text = Loc ('Multiple importable models found. Select the model you would like to import from the list below.');
        AddDiv (contentDiv, 'ov_dialog_message', text);

        let fileListSection = AddDiv (contentDiv, 'ov_dialog_section');
        let fileList = AddDiv (fileListSection, 'ov_dialog_import_file_list ov_thin_scrollbar');

        for (let i = 0; i < fileNames.length; i++) {
            let fileName = fileNames[i];
            let fileLink = AddDiv (fileList, 'ov_dialog_file_link');
            AddSvgIconElement (fileLink, 'meshes', 'ov_file_link_img');
            AddDiv (fileLink, 'ov_dialog_file_link_text', fileName);
            fileLink.addEventListener ('click', () => {
                dialog.SetCloseHandler (null);
                dialog.Close ();
                onSelect (i);
            });
        }

        dialog.Open ();
        return dialog;
    }

    CloseDialogIfOpen ()
    {
        if (this.modalDialog !== null) {
            this.modalDialog.Close ();
            this.modalDialog = null;
        }
    }
}
