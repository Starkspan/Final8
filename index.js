
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const vision = require("@google-cloud/vision");
const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const client = new vision.ImageAnnotatorClient();

app.use(cors());
app.use(express.json());

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Keine Datei empfangen." });

    const [result] = await client.documentTextDetection({ image: { content: req.file.buffer } });
    const text = result.fullTextAnnotation?.text || "";

    if (!text) return res.status(400).json({ error: "Kein Text erkannt." });

    const extract = (regex) => (text.match(regex) || [])[1] || "nicht erkannt";

    const teilname = extract(/Benennung\s*[:=]?\s*(.+)/i) || extract(/Konturplatte\s*([\d\sxX\.,]+)/i) || extract(/Antriebswelle/i) || "unbekannt";
    const zeichnungsnummer = extract(/(\d{4}-\d{2}-\d{3}-[a-z])|A\d{6,}/i);
    const materialRaw = extract(/1\.\d{4}|3\.\d{4}|AlMg\w*|S235|C45|1\.4301|1\.4305/i);
    let material = "unbekannt", dichte = 7.85;

    if (/1\.4301|1\.4305|edelstahl/i.test(materialRaw)) { material = "Edelstahl"; dichte = 7.9; }
    else if (/1\.2767|werkzeugstahl/i.test(materialRaw)) { material = "Werkzeugstahl"; dichte = 7.85; }
    else if (/3\.4365|almg|aluminium/i.test(materialRaw)) { material = "Aluminium"; dichte = 2.7; }

    const masseMatch = text.match(/(\d{2,4})\s?[xX*]\s?(\d{2,4})\s?[xX*]\s?(\d{1,4}[\.,]\d{1,2})/);
    let masse = "nicht erkannt", gewicht = "k.A.", preis1 = "-", preis10 = "-", preis100 = "-";

    if (masseMatch) {
      const [l, b, h] = masseMatch.slice(1, 4).map(v => parseFloat(v.replace(",", ".")));
      masse = `${l} x ${b} x ${h} mm`;
      const volume_cm3 = (l * b * h) / 1000;
      const weight_kg = (volume_cm3 * dichte) / 1000;
      gewicht = weight_kg.toFixed(3) + " kg";

      const laufzeit = Math.max(5, weight_kg * 20);
      const rohkosten = weight_kg * 2;
      const grundpreis = rohkosten + laufzeit * 0.75 + 60;
      preis1 = (grundpreis * 1.2).toFixed(2);
      preis10 = (grundpreis * 1.0).toFixed(2);
      preis100 = (grundpreis * 0.85).toFixed(2);
    }

    res.json({
      teilname,
      zeichnungsnummer,
      material,
      masse,
      gewicht,
      preis1,
      preis10,
      preis100
    });

  } catch (err) {
    console.error("Analysefehler:", err);
    res.status(500).json({ error: "Analysefehler", detail: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Echtbetrieb Backend V9 läuft auf Port", PORT));
