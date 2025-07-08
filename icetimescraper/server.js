import express from 'express';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Serve your static frontend files (assuming you have index.html in 'public' folder)
app.use(express.static('public'));

// API endpoint to get scraped ice times
app.get('/api/ice-times', (req, res) => {
  fs.readFile('ice_times.json', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read ice times' });
    }
    res.json(JSON.parse(data));
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
