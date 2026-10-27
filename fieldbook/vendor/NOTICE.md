# Bundled third-party components

- Mozilla PDF.js / pdfjs-dist 5.6.205: https://github.com/mozilla/pdf.js (Apache-2.0; license in pdfjs/LICENSE).
- Tesseract.js 7.0.0: https://github.com/naptha/tesseract.js (Apache-2.0; license in ocr/TESSERACT-LICENSE.md). Bundle notices are alongside scripts.
- Tesseract.js-core 7.0.0: https://github.com/naptha/tesseract.js-core (Apache-2.0; license in ocr/CORE-LICENSE).
- English trained data: installed tessdata English model, https://github.com/tesseract-ocr/tessdata_fast (Apache-2.0; copy in ocr/TRAINED-DATA-APACHE-LICENSE).

All are served from this application so document bytes stay in the browser. PDF.js worker and OCR WASM/language data are large static assets. Only the LSTM OCR core is included.
