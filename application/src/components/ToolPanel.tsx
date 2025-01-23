import { useEffect, useState } from "react";

const START_PRONUNCIATION_FN_NAME = "start_pronunciation_assessment"
const START_PRONUNCIATION_FN_DESCRIPTION = `
Call this function on two conditions:
- That you will be silent when this function is called
- That you will remain silent after this function is called, until you call "stop_pronunciation_assessment" function.
This function will let the speech recognizer listen in on the user in the same session and assess the pronunciation.
Once the student reaches the end of the assessment, call "stop_pronunciation_assessment" function.
`;

const STOP_PRONUNCIATION_FN_NAME = "stop_pronunciation_assessment"
const STOP_PRONUNCIATION_FN_DESCRIPTION = `
Call this function on two conditions:
- That you can only call this function when a pronounciation assessment is ongoing
- That you will be silent when this function is called
This function will stop speech recognizer and produce the pronunciation result.
Once the student reaches the end of the assessment, call "stop_pronunciation_assessment" function.
`;

const sessionUpdate = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: START_PRONUNCIATION_FN_NAME,
        description: START_PRONUNCIATION_FN_DESCRIPTION,
        parameters: {
          type: "object",
          strict: true,
          properties: {
            language: {
              type: "string",
              description: "The language that the user is being assessed on.",
              enum: [
                "zh-HK",
                "zh-CN",
                "zh-TW", 
                "ar-EG", 
                "ar-SA"
              ],
            }
          },
          required: ["language"],
        },
      },
      {
        type: "function",
        name: STOP_PRONUNCIATION_FN_NAME,
        description: STOP_PRONUNCIATION_FN_DESCRIPTION
      },
    ],
    tool_choice: "auto",
  },
};

function FunctionCallOutput({ functionCallOutput }) {
  // const { theme, colors } = JSON.parse(functionCallOutput.arguments);

  // const colorBoxes = colors.map((color) => (
  //   <div
  //     key={color}
  //     className="w-full h-16 rounded-md flex items-center justify-center border border-gray-200"
  //     style={{ backgroundColor: color }}
  //   >
  //     <p className="text-sm font-bold text-black bg-slate-100 rounded-md p-2 border border-black">
  //       {color}
  //     </p>
  //   </div>
  // ));

  return (
    <div className="flex flex-col gap-2">
      {/* <p>Theme: {theme}</p> */}
      {/* {colorBoxes} */}
      <pre className="text-xs bg-gray-100 rounded-md p-2 overflow-x-auto">
        {JSON.stringify(functionCallOutput, null, 2)}
      </pre>
    </div>
  );
}

export default function ToolPanel({
  isSessionActive,
  sendClientEvent,
  onStartPronunciation,
  onStopPronunciation,
  events,
}: {
  isSessionActive: boolean;
  sendClientEvent: (event: any) => void;
  onStartPronunciation: (output: any) => Promise<void>;
  onStopPronunciation: () => Promise<void>;
  events: any[];
}) {
  const [functionAdded, setFunctionAdded] = useState(false);
  const [functionCallOutput, setFunctionCallOutput] = useState(null);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!functionAdded && firstEvent.type === "session.created") {
      sendClientEvent(sessionUpdate);
      setFunctionAdded(true);
    }

    const mostRecentEvent = events[0];
    if (
      mostRecentEvent.type === "response.done" &&
      mostRecentEvent.response.output
    ) {
      mostRecentEvent.response.output.forEach((output) => {
        if (
          output.type === "function_call" &&
          output.name === START_PRONUNCIATION_FN_NAME
        ) {
          onStartPronunciation(output);

          // setTimeout(() => {
          //   sendClientEvent({
          //     type: "response.create",
          //     response: {
          //       instructions: `
          //       Ask for student's feedback and aspects of today's lesson they want to revisit next time.
          //     `,
          //     },
          //   });
          // }, 500);
        }
        if (
          output.type === "function_call" &&
          output.name === STOP_PRONUNCIATION_FN_NAME
        ) {
          onStopPronunciation();
        }
      });
    }
  }, [events]);

  useEffect(() => {
    if (!isSessionActive) {
      setFunctionAdded(false);
      setFunctionCallOutput(null);
    }
  }, [isSessionActive]);

  return (
    <section className="h-full w-full flex flex-col gap-4">
      <div className="h-full bg-gray-50 rounded-md p-4">
        <h2 className="text-lg font-bold">Color Palette Tool</h2>
        {isSessionActive ? (
          functionCallOutput ? (
            <FunctionCallOutput functionCallOutput={functionCallOutput} />
          ) : (
            <p>Ask for advice on a color palette...</p>
          )
        ) : (
          <p>Start the session to use this tool...</p>
        )}
      </div>
    </section>
  );
}
