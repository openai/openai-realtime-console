import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

// Perplexity AI search API endpoint
app.post('/api/perplexity-search', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('Searching with Perplexity for:', query);
    console.log('API Key available:', !!process.env.PERPLEXITY_API_KEY);

    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY is not set');
    }

    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          { role: "system", content: "Be precise and concise." },
          { role: "user", content: query }
        ],
        temperature: 0.2,
        top_p: 0.9,
        return_citations: true,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        frequency_penalty: 1
      })
    };

    const response = await fetch('https://api.perplexity.ai/chat/completions', options);
    const data = await response.json();

    console.log('Perplexity API Response Status:', response.status);
    res.json(data);
  } catch (error) {
    console.error('Error performing Perplexity search:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.status, error.response.data);
    }

    // Fallback to mock response
    console.log('Returning mock response');
    res.json({
      mock: true,
      query: req.body.query,
      choices: [
        {
          message: {
            content: "This is a mock result for: " + req.body.query
          }
        }
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
  console.log('Perplexity API Key set:', !!process.env.PERPLEXITY_API_KEY);
});
