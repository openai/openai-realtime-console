require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const cors = require('cors');

app.use(cors());
// Middleware to parse JSON bodies
app.use(express.json());


// 1. GET route to fetch all conversations
app.get('/conversations', async (req, res) => {
    try {
      // Fetch all conversations, including participants (users)
      const conversations = await prisma.conversation.findMany();
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ error: 'Unable to fetch conversations' });
    }
  });
  
// 2. POST route to create a new conversation
app.post('/conversations', async (req, res) => {
    const { summary, items } = req.body;


    try {
        // Create the conversation 
        const conversation = await prisma.conversation.create({
            data: {
                summary,
                items
            },
        });
        res.status(201).json(conversation); // Respond with the newly created conversation
    } catch (error) {
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Unable to create conversation' });
    }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
