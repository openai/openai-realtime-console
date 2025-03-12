"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { getCreditsRemaining } from "@/lib/utils";
import ControlPanel from "./ControlPanel";
import PickPersonality from "./PickPersonality";
import { updateUser } from "@/db/users";
import _ from "lodash";
import HomePageSubtitles from "../HomePageSubtitles";
import PersonalityFilters from "./PersonalityFilters";
import { TranscriptProvider } from "../Realtime/contexts/TranscriptContext";
import { EventProvider } from "../Realtime/contexts/EventContext";
import App from "../Realtime/App";
import { checkIfUserHasApiKey } from "@/app/actions";

const sortPersonalities = (
    personalities: IPersonality[],
    currentPersonalityId: string
) => {
    // place default personality at the 0th index
    const defaultPersonality = personalities.find(
        (personality) => personality.personality_id === currentPersonalityId
    );
    return [
        defaultPersonality,
        ...personalities.filter(
            (personality) => personality.personality_id !== currentPersonalityId
        ),
    ] as IPersonality[];
};

interface PlaygroundProps {
    currentUser: IUser;
    allPersonalities: IPersonality[];
    myPersonalities: IPersonality[];
}

const Playground: React.FC<PlaygroundProps> = ({
    currentUser,
    allPersonalities,
    myPersonalities,
}) => {
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);

    useEffect(() => {
        const checkApiKey = async () => {
            const hasApiKey = await checkIfUserHasApiKey(currentUser.user_id);
            setHasApiKey(hasApiKey);
        };
        checkApiKey();
    }, [currentUser.user_id]);

    const supabase = createClient();

    // Remove userState entirely and just use personalityState
    const [personalityIdState, setPersonalityIdState] = useState<string>(
        currentUser.personality!.personality_id! // Initial value from props
    );

    const [selectedFilters, setSelectedFilters] = useState<PersonalityFilter[]>(
        []
    );

    const creditsRemaining = getCreditsRemaining(currentUser);
    const outOfCredits = creditsRemaining <= 0 && !currentUser.is_premium;
    // const ref: any = useRef<ComponentRef<typeof Messages> | null>(null);

    const sortedPersonalities = React.useMemo(
        () => sortPersonalities(allPersonalities, personalityIdState),
        [allPersonalities, personalityIdState]
    );

    const onPersonalityPicked = async (personalityIdPicked: string) => {
        // Instantaneously update the state variable
        setPersonalityIdState(personalityIdPicked);
        await updateUser(
            supabase,
            {
                personality_id: personalityIdPicked,
            },
            currentUser.user_id
        );
    };

    return (
        <div className="flex flex-col">
            <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row items-center gap-4 sm:gap-8 justify-between">
                    <div className="flex flex-row items-center gap-4 sm:gap-8">
                        <h1 className="text-3xl font-normal">
                            {"Playground"}
                        </h1>
                        <div className="flex flex-col gap-8 items-center justify-center">
                        <TranscriptProvider>
      <EventProvider>
        <App hasApiKey={hasApiKey} personalityIdState={personalityIdState} />
      </EventProvider>
    </TranscriptProvider>
                        </div>
                    </div>
                </div>

                <HomePageSubtitles
                    user={currentUser}
                    page="home"
                    languageCode={'en-US'}
                />
                <div className="flex flex-col gap-2">
                        <PersonalityFilters
                            setSelectedFilters={setSelectedFilters}
                            selectedFilters={selectedFilters}
                            languageState={'en-US'}
                            currentUser={currentUser}
                        />
                        <PickPersonality
                            selectedFilters={selectedFilters}
                            onPersonalityPicked={onPersonalityPicked}
                            allPersonalities={sortedPersonalities}
                            personalityIdState={personalityIdState}
                            currentUser={currentUser}
                            languageState={'en-US'}
                            disableButtons={false}
                            myPersonalities={myPersonalities}
                        />
                    </div>
            </div>

            {/* {connectionStatus === "Open" && personalityTranslation && (
                <div className="flex flex-col gap-2 mt-2">
                    <MessageHeader
                        personalityTranslation={personalityTranslation}
                    />
                    <Messages
                        messageHistory={messageHistory}
                        currentUser={currentUser}
                        personalityTranslation={personalityTranslation}
                        emotionDictionary={emotionDictionary}
                    />
                </div>
            )} */}
            {/* <ControlPanel
                connectionStatus={connectionStatus}
                isMuted={isMuted}
                muteMicrophone={muteMicrophone}
                unmuteMicrophone={unmuteMicrophone}
                handleClickInterrupt={handleClickInterrupt}
                handleClickCloseConnection={handleClickCloseConnection}
                microphoneStream={microphoneStream}
                audioBuffer={audioBuffer}
            /> */}
        </div>
    );
};

export default Playground;