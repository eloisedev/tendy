import express from 'express';
import path from 'path';

const app = express();

app.get('/api/ice-times', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'icetimescraper', 'ice_times.json'));
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});
