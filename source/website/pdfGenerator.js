import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { AddDiv, AddDomElement } from '../engine/viewer/domutils.js';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

function AddButton(parentElement, text, className, onClick) {
    const button = AddDomElement(parentElement, 'button', className);
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

export function generatePdf(data) {
    const { name, email, description, tags, intensity, duration, images, siteUrl } = data;
    const date = new Date().toLocaleDateString();

    // Ensure images are correctly formatted and include a border
    const imageObjects = images.map((image, index) => ({
        stack: [
            {
                canvas: [
                    { type: 'rect', x: 0, y: 0, w: 250, h: 188, r: 5, lineWidth: 1, lineColor: '#000000' }
                ]
            },
            {
                image: image.startsWith('data:image/') ? image : 'data:image/png;base64,' + image,
                width: 250,
                height: 188,
                margin: [0, -188, 0, 10],
                alignment: 'center'
            }
        ],
        margin: [0, 10]
    }));

    const docDefinition = {
        content: [
            { text: 'Pain Snapshot Report', style: 'header' },
            { text: `Generated on: ${date}`, style: 'subheader' },
            { text: `Name: ${name}`, style: 'subheader' },
            email ? { text: `Email: ${email}`, style: 'subheader' } : {},
            description ? { text: `Description: ${description}`, style: 'subheader' } : {},
            tags ? { text: `Tags: ${tags}`, style: 'subheader' } : {},
            intensity ? { text: `Pain Intensity: ${intensity}`, style: 'subheader' } : {},
            duration ? { text: `Pain Duration: ${duration}`, style: 'subheader' } : {},
            { text: 'Snapshots', style: 'header', margin: [0, 20, 0, 10] },
            {
                columns: [
                    { stack: [imageObjects[0]], width: '100%' }
                ],
                columnGap: 10,
                margin: [0, 20, 0, 10]
            },
            {
                columns: [
                    { stack: [imageObjects[1]], width: '50%' },
                    { stack: [imageObjects[2]], width: '50%' }
                ],
                columnGap: 10
            },
            { text: `Visit us at: ${siteUrl}`, style: 'footer', link: siteUrl }
        ],
        styles: {
            header: {
                fontSize: 28,
                bold: true,
                margin: [0, 0, 0, 10],
                alignment: 'center',
                color: '#2E86C1'
            },
            subheader: {
                fontSize: 16,
                margin: [0, 5, 0, 5],
                color: '#34495E'
            },
            footer: {
                fontSize: 14,
                margin: [0, 20, 0, 0],
                color: '#2980B9',
                alignment: 'center'
            },
            imageBorder: {
                border: [1, 1, 1, 1],
                borderColor: '#000'
            }
        },
        defaultStyle: {
            font: 'Roboto'
        }
    };

    pdfMake.createPdf(docDefinition).download('Pain_Snapshot_Report.pdf');
}

export function addPdfGenerationSection(parentDiv, modelFiles, siteUrl) {
    let pdfSection = AddDiv(parentDiv, 'ov_dialog_section');
    AddDiv(pdfSection, 'ov_dialog_inner_title', 'Generate PDF');

    // Create form fields for optional data
    const nameInput = AddDomElement(pdfSection, 'input', null);
    nameInput.setAttribute('type', 'text');
    nameInput.setAttribute('placeholder', 'Name (required)');
    nameInput.required = true;

    const emailInput = AddDomElement(pdfSection, 'input', null);
    emailInput.setAttribute('type', 'email');
    emailInput.setAttribute('placeholder', 'Email (optional)');

    const descriptionInput = AddDomElement(pdfSection, 'textarea', null);
    descriptionInput.setAttribute('placeholder', 'Description (optional)');

    const tagsInput = AddDomElement(pdfSection, 'input', null);
    tagsInput.setAttribute('type', 'text');
    tagsInput.setAttribute('placeholder', 'Tags (optional)');

    // Add button to generate PDF
    AddButton(pdfSection, 'Generate PDF', 'ov_button', () => {
        const data = {
            name: nameInput.value,
            email: emailInput.value,
            description: descriptionInput.value,
            tags: tagsInput.value,
            images: modelFiles,  // Assuming you have a way to convert modelFiles to base64-encoded image data
            siteUrl
        };
        generatePdf(data);
    });
}