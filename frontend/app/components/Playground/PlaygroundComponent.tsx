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
import PickLanguage from "./PickLanguage";
import { tx } from "@/utils/i18n";
import PersonalityFilters from "./PersonalityFilters";

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
    allLanguages: ILanguage[];
}

const Playground: React.FC<PlaygroundProps> = ({
    currentUser,
    allPersonalities,
    allLanguages,
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
    const [languageState, setLanguageState] = useState<LanguageCodeType>(
        currentUser.language_code! // Initial value from props
    );

    const [selectedFilters, setSelectedFilters] = useState<PersonalityFilter[]>(
        []
    );

    const t = tx(languageState);

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

    const onLanguagePicked = async (languagePicked: LanguageCodeType) => {
        setLanguageState(languagePicked);
        await updateUser(
            supabase,
            {
                language_code: languagePicked,
            },
            currentUser.user_id
        );
    };

    const startCall = useCallback(
        (personalityId: string) => {
            const personalityInLanguage = allPersonalities
                .find(
                    (personality) =>
                        personality.personality_id === personalityId
                )!
                .personalities_translations.find(
                    (translation) => translation.language_code === languageState
                )!;
            handleClickOpenConnection(
                personalityInLanguage.personalities_translation_id
            );
        },
        [languageState, allPersonalities, handleClickOpenConnection]
    );

    const personalityTranslation =
        allPersonalities
            .find(
                (personality) =>
                    personality.personality_id === personalityIdState
            )
            ?.personalities_translations.find(
                (translation) => translation.language_code === languageState
            ) ?? undefined;

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
                                <Button
                                    disabled={
                                        !currentUser ||
                                        isSelectDisabled ||
                                        !personalityTranslation
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
                            )}
                        </div>
                    </div>

                    <PickLanguage
                        onLanguagePicked={onLanguagePicked}
                        allLanguages={allLanguages}
                        languageState={languageState}
                        isDisabled={isSelectDisabled}
                    />
                </div>

                <HomePageSubtitles
                    user={currentUser}
                    page="home"
                    languageCode={languageState}
                />
                {connectionStatus != "Open" ? (
                    <div className="flex flex-col gap-2">
                        <PersonalityFilters
                            setSelectedFilters={setSelectedFilters}
                            selectedFilters={selectedFilters}
                            languageState={languageState}
                            currentUser={currentUser}
                        />
                        <PickPersonality
                            selectedFilters={selectedFilters}
                            onPersonalityPicked={onPersonalityPicked}
                            allPersonalities={sortedPersonalities}
                            personalityIdState={personalityIdState}
                            currentUser={currentUser}
                            startCall={startCall}
                            languageState={languageState}
                            disableButtons={outOfCredits}
                        />
                    </div>
                ) : null}
            </div>

            {connectionStatus === "Open" && personalityTranslation && (
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
            )}
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
