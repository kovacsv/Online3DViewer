import { ReadLines } from '../engine/import/importerutils.js';
import { AddDiv, CreateDomElement } from '../engine/viewer/domutils.js';
import { ButtonDialog } from './dialog.js';
import { findName } from './language.js';

export function ShowOpenUrlDialog(onOk) {
  let dialog = new ButtonDialog();
  let urlsTextArea = CreateDomElement('textarea', 'ov_dialog_textarea');
  let contentDiv = dialog.Init(findName('OpenUrl'), [
    {
      name: findName('Cancel'),
      subClass: 'outline',
      onClick() {
        dialog.Close();
      },
    },
    {
      name: findName('OK'),
      onClick() {
        let urls = [];
        ReadLines(urlsTextArea.value, (line) => {
          urls.push(line);
        });
        dialog.Close();
        onOk(urls);
      },
    },
  ]);
  let text = findName('textOpenURL');
  AddDiv(contentDiv, 'ov_dialog_section', text);
  contentDiv.appendChild(urlsTextArea);
  dialog.Open();
  urlsTextArea.focus();
  return dialog;
}
