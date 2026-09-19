const express = require("express");
const multer = require("multer");

const app = express();

const upload = multer({
    dest: "uploads/"
});

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "🎬 AIVideo Server fonctionne !"
    });
});

app.post("/upload-video", upload.single("video"), (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "❌ Aucune vidéo reçue"
        });
    }

    const style = req.body.style || "Aucun style";

    res.json({
        success: true,
        message: "✅ Vidéo reçue par le serveur",
        fichier: req.file.filename,
        style: style
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
