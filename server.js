import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(process.cwd(), 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

app.get('/api/ice-times', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ice_times.json'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
