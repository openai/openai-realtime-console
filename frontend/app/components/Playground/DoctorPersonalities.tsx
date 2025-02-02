import CharacterSection from "./CharacterSection";

interface DoctorPersonalitiesProps {
    onPersonalityPicked: (personalityIdPicked: string) => void;
    allPersonalities: IPersonality[];
    personalityIdState: string;
    startCall: (personalityIdSelected: string) => void;
    languageState: LanguageCodeType;
    disableButtons: boolean;
    selectedFilters: PersonalityFilter[];
}

const DoctorPersonalities: React.FC<DoctorPersonalitiesProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityIdState,
    startCall,
    languageState,
    disableButtons,
    selectedFilters,
}) => {
    const doctorPersonalitiesTranslations = allPersonalities.filter(
        (personality) => {
            return personality.is_doctor;
        }
    );
    const nonDoctorPersonalitiesTranslations = allPersonalities.filter(
        (personality) => {
            return !personality.is_doctor;
        }
    );
    return (
        <div className="flex flex-col gap-8 w-full">
            <CharacterSection
                selectedFilters={selectedFilters}
                allPersonalities={doctorPersonalitiesTranslations}
                languageState={languageState}
                personalityIdState={personalityIdState}
                onPersonalityPicked={onPersonalityPicked}
                startCall={startCall}
                title={"Doctor's AI Assistants"}
                disableButtons={disableButtons}
            />
            <CharacterSection
                selectedFilters={selectedFilters}
                allPersonalities={nonDoctorPersonalitiesTranslations}
                languageState={languageState}
                personalityIdState={personalityIdState}
                onPersonalityPicked={onPersonalityPicked}
                startCall={startCall}
                title={"Characters"}
                disableButtons={disableButtons}
            />
        </div>
    );
};

export default DoctorPersonalities;
