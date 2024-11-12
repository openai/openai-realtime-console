import openai from './openaiConfig';

export async function fetch_matching_cities_in_france(location: string): Promise<{ name: string; description: string }[]> {
  const prompt = `You are a French tourism expert. Based on the description: "${location}", list up to 5 matching cities in France. For each city, provide a brief description highlighting its key features. Return the result as a JSON array of objects, each with 'name' and 'description' fields. Ensure the descriptions are concise and informative.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides information about French cities in JSON format, without the formatting, just the plain JSON as a string.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log(response);
    const responseText = response.choices[0].message?.content;
    if (!responseText) throw new Error('No response from OpenAI');

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
}

export async function suggest_popular_themes_for_locations(city: string): Promise<string[]> {
  const prompt = `You are a French travel guide. For the city of ${city} in France, suggest 5 popular themes or activities for visitors. Consider various interests such as history, art, food, nature, and local culture. Return the result as a JSON array of strings, where each string is a theme or activity.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that provides travel recommendations in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 250
    });

    const responseText = response.choices[0].message?.content;
    if (!responseText) throw new Error('No response from OpenAI');

    return JSON.parse(responseText);
  } catch (error) {
    console.error(`Error fetching themes for ${city}:`, error);
    throw error;
  }
}
