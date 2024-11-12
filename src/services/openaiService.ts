import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const getSuggestedLocations = async (locationDescription: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that suggests locations in France based on descriptions."
      },
      {
        role: "user",
        content: `Suggest 5 locations in France that match this description: ${locationDescription}. Return the result as a JSON array of objects with 'name' and 'description' properties. Do not include any code formatting, just send the plain JSON.`
      }
    ],
  });

  return JSON.parse(response.choices[0].message.content || '[]');
};

export const getSuggestedThemes = async (locations: string[]) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that suggests travel themes based on locations in France."
      },
      {
        role: "user",
        content: `Suggest 5 travel themes that would be suitable for these locations: ${locations.join(', ')}. Return the result as a JSON array of strings. Do not include any code formatting, just send the plain JSON.`
      }
    ],
  });

  return JSON.parse(response.choices[0].message.content || '[]');
};

export const getSuggestedActivities = async (location: string, themes: string[]) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that suggests activities based on a location and themes in France."
      },
      {
        role: "user",
        content: `Suggest 5 activities in ${location} related to these themes: ${themes.join(', ')}. Return the result as a JSON array of objects with 'name' and 'description' properties. Do not include any code formatting, just send the plain JSON.`
      }
    ],
  });

  return JSON.parse(response.choices[0].message.content || '[]');
};
