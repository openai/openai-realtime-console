import OpenAI from 'openai';

const apiKey = process.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty; either provide it, or instantiate the OpenAI client with an apiKey option, like new OpenAI({ apiKey: \'My API Key\' }).');
}

const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Only use this if you're calling the API from the browser
});

export default openai;