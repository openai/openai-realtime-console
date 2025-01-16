import { useEffect, useState } from "react";

const functionDescription = `
Call this function when a user asks for a color palette.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "display_color_palette",
        description: functionDescription,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            theme: {
              type: "string",
              description: "Description of the theme for the color scheme.",
            },
            colors: {
              type: "array",
              description: "Array of five hex color codes based on the theme.",
              items: {
                type: "string",
                description: "Hex color code",
              },
            },
          },
          required: ["theme", "colors"],
        },
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  const { theme, colors } = JSON.parse(functionCallOutput.arguments);

  const colorBoxes = colors.map((color) => (
    <div
      key={color}
      className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
      style={{ backgroundColor: color }}
    >
      <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
        {color}
      </p>
    </div>
  ));

  return (
    <div className="flex flex-col gap-2">
      <p>Theme: {theme}</p>
      {colorBoxes}
      <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
        {JSON.stringify(functionCallOutput, null, 2)}
      </pre>
    </div>
  );
}
export default function LeftPanel({ events }) {
  const [transcript, setTranscript] = useState<
    { timestamp: number; transcript: string; participant: "user" | "fin" }[]
  >([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    setTranscript(
      events
        .filter(
          ({ event }) =>
            event === "user_transcript_item" || event === "fin_transcript_item"
        )
        .map(({ event, timestamp, transcript, participant }) => {
          return {
            timestamp,
            transcript,
            participant: event === "user_transcript_item" ? "user" : "fin",
          };
        })
    );

    // const firstEvent = events[events.length - 1];
    // if (!functionAdded && firstEvent.type === "session.created") {
    //   sendClientEvent(sessionUpdate);
    //   setFunctionAdded(true);
    // }

    // const mostRecentEvent = events[0];

    // if (mostRecentEvent.type === "transcript") {
    //   setTranscript(mostRecentEvent.transcript);

    // if (
    //   mostRecentEvent.type === "response.done" &&
    //   mostRecentEvent.response.output
    // ) {
    //   mostRecentEvent.response.output.forEach((output) => {
    //     if (
    //       output.type === "function_call" &&
    //       output.name === "display_color_palette"
    //     ) {
    //       setFunctionCallOutput(output);
    //       setTimeout(() => {
    //         sendClientEvent({
    //           type: "response.create",
    //           response: {
    //             instructions: `
    //             ask for feedback about the color palette - don't repeat
    //             the colors, just ask if they like the colors.
    //           `,
    //           },
    //         });
    //       }, 500);
    //     }
    //   });
    // }
  }, [events]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4 flex flex-col gap-2">
        <h2 className="text-lg font-bold">Transcript</h2>

        <div className="flex flex-col gap-4 overflow-y-auto w-full">
          {transcript.length > 0 ? (
            transcript.map(({ timestamp, transcript, participant }) => (
              <div
                key={timestamp}
                className={`flex flex-col gap-2 w-fit max-w-full ${
                  participant === "user"
                    ? "bg-blue-100 text-right ml-auto"
                    : "bg-green-100 mr-auto"
                } p-4 rounded-md`}
              >
                <h3 className={`text-md font-bold `}>
                  {participant.charAt(0).toUpperCase() +
                    participant.slice(1).toLowerCase()}
                </h3>
                <p className="text-sm">{transcript}</p>
                <p className="text-xs text-gray-500">
                  {new Date(timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p>No transcript available</p>
          )}
        </div>
      </div>
    </section>
  );
}
