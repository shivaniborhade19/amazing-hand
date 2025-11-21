import express from "express";
import bodyParser from "body-parser";
import cors from "cors"; 
import fs from "fs";
import path from "path";
import readline from "readline";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// === Paths ===
const UPLOAD_DIR = "/home/pi/arduino_uploads";
const LOG_FILE = "/home/pi/uploader.log";
const USER_FOLDER = "/home/pi/user_folder";

// === Ensure folders exist ===
if (!fs.existsSync(USER_FOLDER)) fs.mkdirSync(USER_FOLDER, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "📜 Log started...\n");

// === SSE clients ===
let clients = [];

// === 1️⃣ Log file streaming ===
function streamLogFile() {
  let lastSize = 0;

  fs.watchFile(LOG_FILE, { interval: 1000 }, (curr, prev) => {
    const newSize = curr.size;
    if (newSize > lastSize) {
      const stream = fs.createReadStream(LOG_FILE, {
        encoding: "utf8",
        start: lastSize,
        end: newSize,
      });

      let newData = "";
      stream.on("data", (chunk) => (newData += chunk));
      stream.on("end", () => {
        const lines = newData.trim().split("\n");
        lines.forEach((line) => {
          clients.forEach((res) => res.write(`data: ${line}\n\n`));
        });
      });

      lastSize = newSize;
    }
  });
}

streamLogFile();

// === 2️⃣ SSE connection ===
app.get("/logs", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.push(res);
  console.log(" New log client connected. Total:", clients.length);

  req.on("close", () => {
    clients = clients.filter((client) => client !== res);
    console.log(" Client disconnected. Remaining:", clients.length);
  });
});

// === 3️⃣ Upload endpoint ===
app.post("/upload", (req, res) => {
  const { filename, code } = req.body;
  if (!filename || !code)
    return res.status(400).json({ message: "Missing filename or code" });

  const destPath = path.join(UPLOAD_DIR, filename);

  try {
    //  Remove old file (if exists)
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);

    //  Write new file
    fs.writeFileSync(destPath, code, "utf8");

    //  Update modification time to force uploader.py trigger
    const now = new Date();
    fs.utimesSync(destPath, now, now);

    console.log(" File uploaded to:", destPath);
    res.json({ message: ` ${filename} uploaded to server successfully.` });
  } catch (err) {
    console.error(" Upload failed:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});


// === 4️⃣ Save user-created file ===
app.post("/api/save-file", (req, res) => {
  const { filename, code } = req.body;
  if (!filename || !code)
    return res.status(400).json({ error: "Missing filename or code" });

  const safeName = filename.endsWith(".ino") ? filename : `${filename}.ino`;
  const filePath = path.join(USER_FOLDER, safeName);

  try {
    fs.writeFileSync(filePath, code, "utf8");
    console.log(" User file saved:", safeName);
    res.json({ message: ` Saved as ${safeName}` });
  } catch (err) {
    console.error(" Error saving user file:", err);
    res.status(500).json({ message: "Error saving file" });
  }
});

// === 5️⃣ List user files ===
// === 5️⃣ List user files (with proper format) ===
app.get("/api/files", (req, res) => {
  try {
    const files = fs.readdirSync(USER_FOLDER).filter(f => f.endsWith(".ino"));
    const detailedFiles = files.map(filename => {
      const filePath = path.join(USER_FOLDER, filename);
      const code = fs.readFileSync(filePath, "utf8");
      return { filename, code };
    });

    res.json({ files: detailedFiles }); // ✅ frontend expects this shape
  } catch (err) {
    console.error(" Error reading user folder:", err);
    res.status(500).json({ message: "Failed to read files" });
  }
});


// === 6️⃣ Load specific file ===
app.get("/api/file/:filename", (req, res) => {
  const filePath = path.join(USER_FOLDER, req.params.filename);
  if (!fs.existsSync(filePath))
    return res.status(404).json({ error: "File not found" });

  const content = fs.readFileSync(filePath, "utf8");
  res.json({ content });
});

// === 7️⃣ Save client location ===
const COUNTRY_FOLDER = "/home/pi/country";
if (!fs.existsSync(COUNTRY_FOLDER)) fs.mkdirSync(COUNTRY_FOLDER, { recursive: true });

app.post("/api/save-location", (req, res) => {
  const { country, city, ip } = req.body;

  if (!country) return res.status(400).json({ message: "Country required" });

  try {
    const filePath = path.join(COUNTRY_FOLDER, `${country}.json`);
    const newEntry = {
      country,
      city,
      ip,
      timestamp: new Date().toISOString(),
    };

    let existing = [];
    if (fs.existsSync(filePath)) {
      const oldData = fs.readFileSync(filePath, "utf8");
      try {
        existing = JSON.parse(oldData);
        if (!Array.isArray(existing)) existing = [existing];
      } catch {
        existing = [];
      }
    }

    existing.push(newEntry);
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2));

    console.log(`🌍 Saved location info for: ${country}`);
    res.json({ message: "Location saved successfully" });
  } catch (err) {
    console.error("Error saving location:", err);
    res.status(500).json({ message: "Failed to save location" });
  }
});

app.get("/api/countries", (req, res) => {
  try {
    const files = fs.readdirSync(COUNTRY_FOLDER);
    const all = files.map(f => {
      const content = fs.readFileSync(path.join(COUNTRY_FOLDER, f), "utf8");
      return JSON.parse(content);
    });
    res.json(all);
  } catch (err) {
    console.error("Error reading country folder:", err);
    res.status(500).json({ error: "Failed to read country folder" });
  }
});
// === Server start ===
app.listen(5000, "0.0.0.0", () => console.log(" Server running on port 5000"));
