const { AzureOpenAI } = require("openai");
import OpenAI from "openai";

// Load the .env file if it exists
const dotenv = require("dotenv");
dotenv.config();

export const generateSuggestion = async (
    cardData: CardData | null,
    barData: BarData[],
    lineData: LineData[],
    pieData: PieData[]
): Promise<string | undefined> => {
    // You will need to set these environment variables or edit the following values
    // if OPENAI_API_KEY exists, use it, otherwise use AZURE_OPENAI_API_KEY

    const cardDataString = JSON.stringify(cardData);
    const barDatatring = JSON.stringify(barData);
    const lineDataString = JSON.stringify(lineData);
    const pieDataString = JSON.stringify(pieData);

    let client: any;
    let result: any;
    const deployment = process.env["LLM_MODEL_NAME"] || "gpt-4o";
    const messages = [
        {
            role: "system",
            content: `You are an assistant who provides insight based on children's emotional data.`,
        },
        {
            role: "user",
            content: `Please provide a 50-word of suggestion of the below data:

      Main emotions today & Significant Emotional Shifts with today's and yesterday's data:\n
      ${cardDataString}

      Sentiment Over Time:
      ${lineDataString}

      Sentiment Proportions Today:
      ${pieDataString}
      
      Current Emotions Breakdown:
      ${barDatatring}`,
        },
    ];

    if (process.env.OPENAI_API_KEY) {
        client = new OpenAI();
        result = await client.chat.completions.create({
            model: deployment,
            messages,
        });
    } else {
        const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
        const apiKey = process.env["AZURE_OPENAI_API_KEY"];
        const apiVersion = "2024-02-01"; //"2024-02-01"

        client = new AzureOpenAI({
            endpoint,
            apiKey,
            apiVersion,
            deployment,
        });
        result = await client.chat.completions.create({
            model: deployment,
            messages,
        });
    }

    //   if cardData is null
    if (
        cardData === null &&
        barData.length === 0 &&
        lineData.length === 0 &&
        pieData.length === 0
    ) {
        return "Talk to a character in the Playground or on your Elato device to view your trends.";
    }

    return result.choices[0].message.content;
};
