import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the *public* folder
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve index.html at the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// API route to serve ice_times.json
app.get('/api/ice-times', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ice_times.json'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
