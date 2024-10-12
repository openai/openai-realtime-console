import axios from 'axios';

const API_ENDPOINT = 'https://beta.webpilotai.com/api/v1/watt';
const API_KEY = '04a0491fb7ae462a8dbe8203979461ff';

interface WattApiResponse {
  content: string;
}

interface WattApiRequest {
  model: string;
  content: string;
}

export async function wattApi(content: string, model: string = 'wp-watt-4.02-16k'): Promise<string> {
  const data: WattApiRequest = {
    model,
    content,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  try {
    const response = await axios.post<WattApiResponse>(API_ENDPOINT, data, { headers });
    return response.data.content;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Watt API error: ${error.response.status} - ${error.response.data}`);
      } else {
        throw new Error(`Watt API network error: ${error.message}`);
      }
    }
    throw error;
  }
}

export async function wattApiStream(content: string, model: string = 'wp-watt-4.02-16k'): Promise<ReadableStream<string>> {
  const data: WattApiRequest = {
    model,
    content,
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
  };

  const response = await fetch(`${API_ENDPOINT}/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.body) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  const transformStream = new TransformStream({
    transform(chunk: Uint8Array, controller) {
      controller.enqueue(decoder.decode(chunk, { stream: true }));
    },
  });

  return response.body.pipeThrough(transformStream);
}
