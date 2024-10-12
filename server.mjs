import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors({
  origin: 'http://localhost:3000' // or your frontend URL
}));
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
