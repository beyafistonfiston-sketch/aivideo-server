const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { fal } = require("@fal-ai/client");

const app = express();

const upload = multer({
    dest: "uploads/"
});

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Vérification du serveur
app.get("/", (req, res) => {
    res.json({
        message: "🎬 AIVideo Server fonctionne !",
        ia: "fal.ai"
    });
});

// Transformation vidéo
app.post("/upload-video", upload.single("video"), async (req, res) => {

    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "❌ Aucune vidéo reçue"
        });
    }

    try {

        const style = req.body.style || "🧸 Nounours";

        // Prompts selon le style choisi
        let prompt = "";

        if (style.includes("Nounours")) {

            prompt =
                "transform the person and the entire scene into a cute realistic teddy bear character, soft plush fur, adorable teddy bear appearance, preserve the original movement and composition, high quality";

        } else if (style.includes("Coco")) {

            prompt =
                "transform the person into a cute coconut character, tropical coconut appearance, fun and detailed, preserve the original movement and composition, high quality";

        } else if (style.includes("Dessin animé")) {

            prompt =
                "transform the entire video into a beautiful high quality 3D animated cartoon style, colorful, smooth animation, preserve the original movement and composition";

        } else if (style.includes("Robot")) {

            prompt =
                "transform the person into a futuristic humanoid robot, metallic details, cinematic futuristic appearance, preserve the original movement and composition, high quality";

        } else {

            prompt =
                "transform the video into a creative animated style, preserve the original movement and composition, high quality";
        }

        console.log("🎨 Style :", style);
        console.log("🤖 Prompt :", prompt);

        // Lire la vidéo reçue
        const videoBuffer = fs.readFileSync(req.file.path);

        // Préparer le fichier pour fal.ai
        const videoFile = new File(
            [videoBuffer],
            req.file.originalname || "video.mp4",
            {
                type: req.file.mimetype || "video/mp4"
            }
        );

        console.log("📤 Envoi de la vidéo à fal.ai...");

        // Envoyer la vidéo vers le stockage fal.ai
        const videoUrl = await fal.storage.upload(videoFile);

        console.log("✅ Vidéo envoyée à fal.ai");

        // Lancer la transformation IA
        const result = await fal.subscribe(
            "fal-ai/fast-animatediff/video-to-video",
            {
                input: {
                    video_url: videoUrl,
                    prompt: prompt,
                    first_n_seconds: 3,
                    strength: 0.7,
                    num_inference_steps: 25,
                    guidance_scale: 7.5,
                    fps: 8
                },
                logs: true,
                onQueueUpdate: (update) => {

                    if (update.status === "IN_PROGRESS") {
                        console.log("🤖 IA en cours...");
                    }

                    if (update.status === "IN_QUEUE") {
                        console.log("⏳ Vidéo en attente...");
                    }
                }
            }
        );

        console.log("🎉 Transformation terminée !");

        // Supprimer le fichier temporaire
        try {
            fs.unlinkSync(req.file.path);
        } catch (e) {
            console.log("⚠️ Impossible de supprimer le fichier temporaire");
        }

        // Vérifier le résultat
        if (
            !result ||
            !result.data ||
            !result.data.video ||
            !result.data.video.url
        ) {

            return res.status(500).json({
                success: false,
                message: "❌ fal.ai n'a pas retourné de vidéo"
            });
        }

        const videoTransformee = result.data.video.url;

        console.log("🎬 Vidéo finale :", videoTransformee);

        // Retourner la vidéo à l'application Android
        res.json({
            success: true,
            message: "✅ Vidéo transformée avec succès",
            style: style,
            videoUrl: videoTransformee
        });

    } catch (error) {

        console.error("❌ ERREUR FAL.AI :", error);

        try {
            fs.unlinkSync(req.file.path);
        } catch (e) {
        }

        res.status(500).json({
            success: false,
            message: "❌ Erreur lors de la transformation IA",
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur AIVideo démarré sur le port ${PORT}`);
});
