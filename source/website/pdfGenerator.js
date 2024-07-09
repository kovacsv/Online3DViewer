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

    const docDefinition = {
        content: [
            { text: 'Pain Snapshot Report', style: 'header' },
            { text: `Generated on: ${date}`, style: 'subheader' },
            { text: `Name: ${name}`, style: 'subheader' },
            email ? { text: `Email: ${email}`, style: 'subheader' } : {},
            description ? { text: `Description: ${description}`, style: 'subheader' } : {},
            tags ? { text: `Tags: ${tags}`, style: 'subheader' } : {},
            { text: `Pain Intensity: ${intensity}`, style: 'subheader' },
            { text: `Pain Duration: ${duration}`, style: 'subheader' },
            { text: 'Snapshots', style: 'header', margin: [0, 20, 0, 10] },
            ...images.map((image, index) => ({
                image,
                width: 500,
                height: 375,
                margin: [0, 10, 0, 10],
                caption: `Snapshot ${index + 1}`
            })),
            { text: `Visit us at: ${siteUrl}`, style: 'footer', link: siteUrl }
        ],
        styles: {
            header: {
                fontSize: 22,
                bold: true,
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 16,
                margin: [0, 5, 0, 5]
            },
            footer: {
                fontSize: 14,
                margin: [0, 20, 0, 0],
                color: 'blue'
            }
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
