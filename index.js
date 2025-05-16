const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 10000;

// Google Vision Client
const client = new vision.ImageAnnotatorClient();

app.use(express.json());

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    const [result] = await client.documentTextDetection({ image: { content: req.file.buffer } });
    const text = result.fullTextAnnotation.text;

    const material = (text.match(/1\.\d{4}/) || [])[0] || 'k.A.';
    const nummer = (text.match(/(A\d{6,})/) || [])[0] || 'k.A.';
    const name = (text.match(/\b[A-Z]{2,}[\w\s\-\/]{5,}/) || [])[0] || 'k.A.';

    const maße = (text.match(/\b(\d{2,4})\s*x\s*(\d{2,4})\s*x\s*(\d{1,4})\b/i) || []).slice(1, 4);
    const [L, B, H] = maße.map(m => parseFloat(m)).filter(Boolean);
    const volumen = L && B && H ? (L / 1000) * (B / 1000) * (H / 1000) : 0;

    const dichte = material === '1.4301' ? 7.9 : material === '1.2024' ? 2.7 : 1.0;
    const gewicht = volumen * dichte;

    const laufzeit = gewicht > 0 ? Math.max(5, gewicht * 2) : 0;
    const materialkosten = gewicht * 2;  // 2 €/kg
    const preis1 = materialkosten + laufzeit * 1.5 + 60;
    const preis10 = preis1 * 0.9;
    const preis100 = preis1 * 0.75;

    res.json({
      filename: req.file.originalname,
      teilname: name,
      zeichnungsnummer: nummer,
      material,
      maße: maße.length === 3 ? maße.join(' x ') + ' mm' : 'nicht erkannt',
      gewicht: gewicht > 0 ? gewicht.toFixed(3) + ' kg' : 'k.A.',
      preis1: preis1.toFixed(2),
      preis10: preis10.toFixed(2),
      preis100: preis100.toFixed(2)
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Analysefehler', details: e.message });
  }
});

app.listen(PORT, () => console.log('✅ Backend V9 läuft auf Port', PORT));
