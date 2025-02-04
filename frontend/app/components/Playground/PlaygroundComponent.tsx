"use client";

import React, { useCallback, useState } from "react";
import { useWebSocketHandler } from "@/hooks/useWebSocketHandler";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { getCreditsRemaining } from "@/lib/utils";
import ControlPanel from "./ControlPanel";
import { Messages } from "./Messages";
import { Play, Sparkles } from "lucide-react";
import PickPersonality from "./PickPersonality";
import { updateUser } from "@/db/users";
import _ from "lodash";
import AddCreditsModal from "../Upsell/AddCreditsModal";
import HomePageSubtitles from "../HomePageSubtitles";
import MessageHeader from "./MessageHeader";
import { tx } from "@/utils/i18n";
import PersonalityFilters from "./PersonalityFilters";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
}

const Playground: React.FC<PlaygroundProps> = ({
    currentUser,
    allPersonalities,
}) => {
    const supabase = createClient();

    const {
        messageHistory,
        emotionDictionary,
        connectionStatus,
        microphoneStream,
        audioBuffer,
        handleClickOpenConnection,
        handleClickInterrupt,
        handleClickCloseConnection,
        muteMicrophone,
        unmuteMicrophone,
        isMuted,
    } = useWebSocketHandler(currentUser);

    // Remove userState entirely and just use personalityState
    const [personalityIdState, setPersonalityIdState] = useState<string>(
        currentUser.personality!.personality_id // Initial value from props
    );

    const [selectedFilters, setSelectedFilters] = useState<PersonalityFilter[]>(
        []
    );

    const t = tx('en-US');

    const creditsRemaining = getCreditsRemaining(currentUser);
    const outOfCredits = creditsRemaining <= 0 && !currentUser.is_premium;
    // const ref: any = useRef<ComponentRef<typeof Messages> | null>(null);

    const isSelectDisabled = connectionStatus === "Open";

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

    const startCall = useCallback(
        (personalityId: string) => {
            handleClickOpenConnection(personalityId);
        },
        [handleClickOpenConnection]
    );

    return (
        <div className="flex flex-col">
            <div className="flex flex-col w-full gap-2">
                <div className="flex flex-row items-center gap-4 sm:gap-8 justify-between">
                    <div className="flex flex-row items-center gap-4 sm:gap-8">
                        <h1 className="text-3xl font-normal">
                            {t("Playground")}
                        </h1>
                        <div className="flex flex-col gap-8 items-center justify-center">
                            {outOfCredits ? (
                                <AddCreditsModal>
                                    <Button
                                        className={
                                            "z-50 flex items-center gap-1.5 rounded-full"
                                        }
                                        size="sm"
                                        variant={"upsell_primary"}
                                    >
                                        <Sparkles
                                            size={16}
                                            strokeWidth={3}
                                            stroke={"currentColor"}
                                        />
                                        <span className="text-md font-semibold">
                                            {t("Upgrade")}
                                        </span>
                                    </Button>
                                </AddCreditsModal>
                            ) : (
                                <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    disabled={
                                        !currentUser ||
                                        isSelectDisabled 
                                    }
                                    className={
                                        "z-50 flex items-center gap-1.5 rounded-full"
                                    }
                                    onClick={() =>
                                        startCall(personalityIdState)
                                    }
                                    size="sm"
                                >
                                    <Play
                                        size={16}
                                        strokeWidth={3}
                                        stroke={"currentColor"}
                                    />
                                    <span className="text-md font-semibold">
                                        {t("Play")}
                                    </span>
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="center" side="bottom">
                                  <div className="grid gap-2 p-2 text-sm">
                                    <span>The online playground will be back soon. Tap your Elato device and hear your character come to life!</span>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                        </div>
                    </div>
                </div>

                <HomePageSubtitles
                    user={currentUser}
                    page="home"
                    languageCode={'en-US'}
                />
                {connectionStatus != "Open" ? (
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
                            startCall={startCall}
                            languageState={'en-US'}
                            disableButtons={outOfCredits}
                        />
                    </div>
                ) : null}
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
            <ControlPanel
                connectionStatus={connectionStatus}
                isMuted={isMuted}
                muteMicrophone={muteMicrophone}
                unmuteMicrophone={unmuteMicrophone}
                handleClickInterrupt={handleClickInterrupt}
                handleClickCloseConnection={handleClickCloseConnection}
                microphoneStream={microphoneStream}
                audioBuffer={audioBuffer}
            />
        </div>
    );
};

export default Playground;
