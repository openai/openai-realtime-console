const express = require('express');
const bodyParser = require('body-parser');
const prisma = require('./db/prisma');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(bodyParser.json());

app.post('/push', async (req, res) => {
  const { dateTime, items } = req.body;

  try {
    const conversation = await prisma.conversation.create({
      data: {
        time: new Date(dateTime),
        content: JSON.stringify(items),
      },
    });
    res.status(200).json(conversation);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error pushing data to the database');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});