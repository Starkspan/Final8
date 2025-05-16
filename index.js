
const express = require('express');
const multer = require('multer');
const vision = require('@google-cloud/vision');
const cors = require('cors');
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const client = new vision.ImageAnnotatorClient();

app.use(cors());
app.use(express.json());

app.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    const [result] = await client.textDetection(req.file.buffer);
    const annotations = result.textAnnotations;

    if (!annotations || annotations.length === 0 || !annotations[0].description) {
      return res.status(400).json({ error: 'Keine Texte erkannt.' });
    }

    const text = annotations[0].description.trim();

    res.json({
      rawText: text,
      message: 'Erkennung erfolgreich'
    });

  } catch (err) {
    console.error("Fehler bei Analyse:", err);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Backend V9 läuft auf Port ${PORT}`);
});
