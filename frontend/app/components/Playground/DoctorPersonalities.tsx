import CharacterSection from "./CharacterSection";

interface DoctorPersonalitiesProps {
    onPersonalityPicked: (personalityIdPicked: string) => void;
    allPersonalities: IPersonality[];
    personalityIdState: string;
    languageState: string;
    disableButtons: boolean;
    selectedFilters: PersonalityFilter[];
    myPersonalities: IPersonality[];
}

const DoctorPersonalities: React.FC<DoctorPersonalitiesProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityIdState,
    languageState,
    disableButtons,
    selectedFilters,
    myPersonalities,
}) => {
    const doctorPersonalities = allPersonalities.filter(
        (personality) => {
            return personality.is_doctor;
        }
    );
    const nonDoctorPersonalities = allPersonalities.filter(
        (personality) => {
            return !personality.is_doctor;
        }
    );
    return (
        <div className="flex flex-col gap-8 w-full">
            <CharacterSection
                selectedFilters={selectedFilters}
                allPersonalities={doctorPersonalities}
                languageState={languageState}
                personalityIdState={personalityIdState}
                onPersonalityPicked={onPersonalityPicked}
                title={"Doctor's AI Assistants"}
                disableButtons={disableButtons}
            />
            {myPersonalities.length > 0 && (
                <CharacterSection
                    selectedFilters={selectedFilters}
                    allPersonalities={myPersonalities}
                    languageState={languageState}
                    personalityIdState={personalityIdState}
                    onPersonalityPicked={onPersonalityPicked}
                    title={"My Characters"}
                    disableButtons={disableButtons}
                />
            )}
            <CharacterSection
                selectedFilters={selectedFilters}
                allPersonalities={nonDoctorPersonalities}
                languageState={languageState}
                personalityIdState={personalityIdState}
                onPersonalityPicked={onPersonalityPicked}
                title={"Characters"}
                disableButtons={disableButtons}
            />
        </div>
    );
};

export default DoctorPersonalities;
