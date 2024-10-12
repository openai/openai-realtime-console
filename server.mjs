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

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// EXA search API endpoint
app.post('/api/exa-search', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Searching with EXA for:', query);
    console.log('API Key available:', !!process.env.EXA_API_KEY);

    if (!process.env.EXA_API_KEY) {
      throw new Error('EXA_API_KEY is not set');
    }

    const response = await axios.post('https://api.exa.ai/search', {
      query: query,
      type: 'auto'

    }, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY
      }
    });

    console.log('EXA API Response Status:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error('Error performing EXA search:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }

    // Fallback to mock response
    console.log('Returning mock response');
    res.json({
      mock: true,
      query: req.body.query,
      results: [
        { title: "Mock Result 1", description: "This is a mock result for: " + req.body.query },
        { title: "Mock Result 2", description: "This is another mock result for: " + req.body.query }
      ]
    });
  }
});

// The "catchall" handler: for any request that doesn't match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('EXA API Key set:', !!process.env.EXA_API_KEY);
});
