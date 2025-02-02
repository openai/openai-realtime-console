import { EnglishCopy, tx } from "@/utils/i18n";
import SheetWrapper from "./SheetWrapper";

interface CharacterSectionProps {
    allPersonalities: IPersonality[];
    languageState: LanguageCodeType;
    personalityIdState: string;
    onPersonalityPicked: (personalityIdPicked: string) => void;
    title: EnglishCopy;
    startCall: (personalityIdSelected: string) => void;
    disableButtons: boolean;
    selectedFilters: PersonalityFilter[];
}

const CharacterSection = ({
    allPersonalities,
    languageState,
    personalityIdState,
    onPersonalityPicked,
    startCall,
    title,
    disableButtons,
    selectedFilters,
}: CharacterSectionProps) => {
    const t = tx(languageState);

    console.log(selectedFilters);

    const filteredPersonalities = allPersonalities.filter((personality) => {
        return selectedFilters.every((filter) => {
            return personality[filter] === true;
        });
    });

    if (filteredPersonalities.length === 0) {
        return (
            <div className="text-sm mt-4 text-gray-400">
                {t("No characters found")}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            <p className="text-sm text-gray-600 self-start flex flex-row items-center gap-2">
                <span>{t(title)}</span>
            </p>
            <div className="w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 md:gap-6 gap-4">
                    {filteredPersonalities.map((personality, index) => (
                        <SheetWrapper
                            languageState={languageState}
                            key={index + personality.personality_id}
                            personality={personality}
                            personalityIdState={personalityIdState}
                            onPersonalityPicked={onPersonalityPicked}
                            startCall={startCall}
                            disableButtons={disableButtons}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CharacterSection;
