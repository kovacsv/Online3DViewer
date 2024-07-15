import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function generatePdf(data) {
    const { name, email, age, gender, typeOfPain, date, images } = data;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const darkBlue = rgb(0.1, 0.2, 0.4);
    const lightBlue = rgb(0.8, 0.9, 1);

    // Background
    page.drawRectangle({
        x: 0,
        y: 0,
        width: 595.28,
        height: 841.89,
        color: lightBlue,
    });

    // Fetch and embed PNG image
    const pngImage = await fetch('assets/images/tmwihn.png').then(res => res.arrayBuffer());
    const image = await pdfDoc.embedPng(pngImage);
    const pngScale = 0.25; // Scale down the image by 50%
    const pngDims = image.scale(pngScale);
    const imageX = (page.getWidth() - pngDims.width) / 2;
    const imageY = page.getHeight() - pngDims.height - 30; // 50 pixels from the top
    
    // Draw the PNG image
    page.drawImage(image, {
        x: imageX,
        y: imageY,
        width: pngDims.width,
        height: pngDims.height,
    });

    //Lets check first if helveticaBoldFont and helveticaFont are loaded
    if (!helveticaBoldFont || !helveticaFont) {
        throw new Error('One or more fonts failed to load');
    }

    // Header
    // drawCenteredText(page, 'TellMewhereithurtsnow', 800, helveticaBoldFont, 24, darkBlue);
    drawCenteredText(page, 'Tell people about your pain', 1500, helveticaFont, 12, darkBlue);

    // Introduction text (justified and indented)
    const introStartY = imageY - 50;
    const introWidth = 495;
    const lineHeight = 20;
    const indent = 20;
    const introText = `Hi ${email || ''},`;
    
    const wrappedText = wrapText(introText, helveticaBoldFont, 12, introWidth);
    wrappedText.forEach((line, index) => {
        const y = introStartY - index * lineHeight;
        const x = (595.28 - introWidth) / 2;
        page.drawText(line, { x: x + (index === 0 ? indent : 0), y, size: 12, font: helveticaBoldFont, color: darkBlue });
    });
    
    // Adjust introBody width for narrower justification
    const introBodyWidth = 450; // Adjust this value as needed
    const introBody = `     Your acquaintance, ${name || ''}, has shared with you a snapshot describing their pain and where they are feeling it. Pain can significantly impact one's quality of life. Understanding its location and intensity helps in diagnosing and managing the underlying causes effectively.`;
    const wrappedBody = wrapText(introBody, helveticaFont, 12, introBodyWidth);
    wrappedBody.forEach((line, index) => {
        const y = introStartY - (wrappedText.length + index) * lineHeight - 10;
        const x = (595.28 - introBodyWidth) / 2;
        page.drawText(line, { x: x, y, size: 12, font: helveticaFont, color: darkBlue });
    });

    // Separator
    const separatorY = introStartY - wrappedText.length * lineHeight - 90;
    page.drawLine({
        start: { x: 50, y: separatorY },
        end: { x: 545, y: separatorY },
        thickness: 1,
        color: darkBlue,
    });

    // Patient information
    const infoStartY = separatorY - 20;
    const infoGap = 15;
    const patientInfo = [
        `Date of record: ${date || ''}`,
        `Patient Name: ${name || ''}`,
        `Age: ${age || ''}`,
        `Gender: ${gender || ''}`,
        `Type of Pain: ${typeOfPain || ''}`
    ];

    patientInfo.forEach((text, index) => {
        page.drawText(text, { x: 50, y: infoStartY - index * infoGap, size: 10, font: helveticaFont, color: darkBlue });
    });

    // Images (lowered position)
    const imageStartY = infoStartY - patientInfo.length * infoGap - 390;
    const mainImageWidth = 320;
    const mainImageHeight = 380;
    const smallImageWidth = 160;
    const smallImageHeight = 185;

    page.drawRectangle({ x: 50, y: imageStartY, width: mainImageWidth, height: mainImageHeight, borderColor: darkBlue, borderWidth: 2 });
    page.drawRectangle({ x: 385, y: imageStartY + smallImageHeight + 10, width: smallImageWidth, height: smallImageHeight, borderColor: darkBlue, borderWidth: 2 });
    page.drawRectangle({ x: 385, y: imageStartY, width: smallImageWidth, height: smallImageHeight, borderColor: darkBlue, borderWidth: 2 });
    
    // Paste images
    await pasteImages(page, images, pdfDoc, imageStartY);

    // Footer with centered "hyperlink-like" text
    const url = 'www.tellmewhereithurtsnow.com';
    drawCenteredText(page, url, 30, helveticaBoldFont, 14, rgb(0, 0, 1)); // Using blue color for link-like appearance

    // Save and download PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'pain_snapshot_report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function pasteImages(page, images, pdfDoc, yStart) {
    const imageStartY = yStart;
    const mainImageWidth = 320;
    const mainImageHeight = 380;
    const smallImageWidth = 160;
    const smallImageHeight = 185;

    if (images.length > 0) {
        const mainImage = await pdfDoc.embedPng(base64ToUint8Array(images[0]));
        page.drawImage(mainImage, {
            x: 50,
            y: imageStartY,
            width: mainImageWidth,
            height: mainImageHeight
        });
    }

    if (images.length > 1) {
        const smallImage1 = await pdfDoc.embedPng(base64ToUint8Array(images[1]));
        page.drawImage(smallImage1, {
            x: 385,
            y: imageStartY + smallImageHeight + 10,
            width: smallImageWidth,
            height: smallImageHeight
        });
    }

    if (images.length > 2) {
        const smallImage2 = await pdfDoc.embedPng(base64ToUint8Array(images[2]));
        page.drawImage(smallImage2, {
            x: 385,
            y: imageStartY,
            width: smallImageWidth,
            height: smallImageHeight
        });
    }
}

// Helper function to wrap text
function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

// Function to convert base64 to Uint8Array
function base64ToUint8Array(base64) {
    const binaryString = window.atob(base64.split(',')[1]);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Function to draw centered text
function drawCenteredText(page, text, y, font, size, color) {
    const textWidth = font.widthOfTextAtSize(text, size);
    const pageWidth = page.getWidth();
    const x = (pageWidth - textWidth) / 2;
    page.drawText(text, { x, y, size, font, color });
}



// Sample data for testing
const sampleData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: '30',
    gender: 'Male',
    typeOfPain: 'Chronic',
    date: new Date().toLocaleDateString(),
    images: [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...', // Add your base64 image data
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...', // Add your base64 image data
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...'  // Add your base64 image data
    ]
};

// Generate the PDF with the sample data
// generatePdf(sampleData);

export { generatePdf };
