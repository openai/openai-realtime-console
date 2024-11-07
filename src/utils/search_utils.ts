export const search_tool_definition = 
    {
      name: 'search',
      description: 'Searches available document corpus and fetches relevant information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The information you want to search for in the document corpus',
          },
        },
        required: ['query'],
      },
    }

export const search_tool_hander = async ({ query }: { [key: string]: any }) => {
    const result = await fetch('http://localhost:5000/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query
      }),
    });
    const json = await result.json();
    return json;
  }