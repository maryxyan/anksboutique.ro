import { Router, type IRouter } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Sunt permise doar fișiere imagine"));
    }
  },
});

router.post("/upload/image", upload.single("file"), (req, res): void => {
  if (!req.file) {
    res.status(400).json({ error: "Nu a fost încărcat niciun fișier" });
    return;
  }

  const filename = req.file.filename;
  const url = `/api/uploads/${filename}`;
  logger.info({ filename }, "Image uploaded");
  res.json({ url, filename });
});

router.get("/uploads/:filename", (req, res): void => {
  const filename = path.basename(req.params.filename as string);
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Fișierul nu a fost găsit" });
    return;
  }
  res.sendFile(filePath);
});

export default router;
