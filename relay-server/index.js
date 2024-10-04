import { RealtimeRelay } from './lib/relay.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_CLIENT_API_KEY = process.env.REACT_APP_USE_CLIENT_API_KEY === 'true';

if (!USE_CLIENT_API_KEY && !OPENAI_API_KEY) {
  console.error(
    `Environment variable "OPENAI_API_KEY" is required when not using a client API key.\n` +
      `Please set it in your .env file or set REACT_APP_USE_CLIENT_API_KEY=true.`
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT) || 8081;

const relay = new RealtimeRelay(OPENAI_API_KEY, USE_CLIENT_API_KEY);
relay.listen(PORT);