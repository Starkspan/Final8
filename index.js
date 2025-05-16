
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

app.post("/analyze", (req, res) => {
  res.json({
    teilname: "Antriebswelle",
    zeichnungsnummer: "2011-70-110-c",
    material: "1.4305",
    masse: "Ø25 x 110 mm",
    gewicht: "0.400 kg",
    preis1: "62.00",
    preis10: "54.00",
    preis100: "45.00"
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Backend-Demo läuft auf Port", PORT));
