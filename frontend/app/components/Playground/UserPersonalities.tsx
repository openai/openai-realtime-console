import CharacterSection from "./CharacterSection";

interface UserPersonalitiesProps {
    onPersonalityPicked: (personalityIdPicked: string) => void;
    allPersonalities: IPersonality[];
    personalityIdState: string;
    startCall: (personalityIdSelected: string) => void;
    languageState: string;
    disableButtons: boolean;
    selectedFilters: PersonalityFilter[];
}

const UserPersonalities: React.FC<UserPersonalitiesProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityIdState,
    startCall,
    languageState,
    disableButtons,
    selectedFilters,
}) => {
    return (
        <CharacterSection
            allPersonalities={allPersonalities}
            languageState={languageState}
            personalityIdState={personalityIdState}
            onPersonalityPicked={onPersonalityPicked}
            startCall={startCall}
            title={"Characters"}
            disableButtons={disableButtons}
            selectedFilters={selectedFilters}
        />
    );
};

export default UserPersonalities;
