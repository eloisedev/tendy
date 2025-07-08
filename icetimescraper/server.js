import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (your index.html and frontend assets)
app.use(express.static(path.join(process.cwd(), 'icetimescraper', 'public')));

// Fallback to index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'icetimescraper', 'public', 'index.html'));
});

// Serve your API endpoint
app.get('/api/ice-times', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'icetimescraper', 'ice_times.json'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
