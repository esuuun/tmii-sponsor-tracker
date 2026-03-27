const fs = require('fs');
const pdfParse = require('pdf-parse');

console.log("Type of pdf-parse:", typeof pdfParse);
console.log("Keys:", Object.keys(pdfParse));

const dataBuffer = fs.readFileSync('prd_Proyek_TMII_Sponsorship.pdf');

try {
    const fn = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse.pdfParse);
    if (typeof fn === 'function') {
        fn(dataBuffer).then(function(data) {
            console.log("PDF_START---");
            console.log(data.text);
            console.log("---PDF_END");
        }).catch(err => console.error("Parse Error:", err));
    } else {
        console.error("Could not find parsing function:", fn);
    }
} catch (e) {
    console.error("Error:", e);
}
