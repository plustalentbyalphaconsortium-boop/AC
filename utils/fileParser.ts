// Declare libraries loaded via CDN in index.html to satisfy TypeScript
declare const mammoth: any;
declare const pdfjsLib: any;

// Configure the PDF.js worker from CDN
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
}

export const parseFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (extension === 'pdf') {
            if (typeof pdfjsLib === 'undefined') {
                return reject('The PDF parsing library failed to load. Please check your network connection and try again.');
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    let text = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const content = await page.getTextContent();
                        text += content.items.map((item: any) => item.str).join(' ') + '\n';
                    }
                    resolve(text);
                } catch (pdfError) {
                    console.error('Error parsing PDF:', pdfError);
                    reject('Failed to parse the PDF file.');
                }
            };
            reader.onerror = () => reject('Failed to read the PDF file.');
            reader.readAsArrayBuffer(file);
        } else if (extension === 'docx') {
            if (typeof mammoth === 'undefined') {
                return reject('The DOCX parsing library failed to load. Please check your network connection and try again.');
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value);
                } catch (docxError) {
                    console.error('Error parsing DOCX:', docxError);
                    reject('Failed to parse the DOCX file.');
                }
            };
            reader.onerror = () => reject('Failed to read the DOCX file.');
            reader.readAsArrayBuffer(file);
        } else {
            reject('Unsupported file type. Please upload a .docx or .pdf file.');
        }
    });
};