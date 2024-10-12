import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration (you might not need this if serving frontend and backend from the same origin)
app.use(cors());

app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Brave search API endpoint
app.post('/api/brave-search', async (req, res) => {
  try {
    const { query } = req.body;
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      params: { q: query },
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': process.env.BRAVE_API_KEY
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error performing Brave search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
