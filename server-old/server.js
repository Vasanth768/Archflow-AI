const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Middleware to parse JSON
app.use(express.json({ limit: '10mb' }));

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// API Routes
app.get('/api/projects', (req, res) => {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return res.json([]);
        }
        const data = fs.readFileSync(DB_PATH, 'utf8');
        res.json(JSON.parse(data || '[]'));
    } catch (e) {
        console.error("Failed to read database:", e);
        res.status(500).json({ error: "Failed to read database" });
    }
});

app.post('/api/projects', (req, res) => {
    try {
        const projects = req.body;
        fs.writeFileSync(DB_PATH, JSON.stringify(projects, null, 2), 'utf8');
        res.json({ success: true });
    } catch (e) {
        console.error("Failed to write to database:", e);
        res.status(500).json({ error: "Failed to save to database" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend API service listening on port ${PORT}`);
});
