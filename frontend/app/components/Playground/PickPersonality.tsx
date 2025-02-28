import DoctorPersonalities from "./DoctorPersonalities";
import UserPersonalities from "./UserPersonalities";

interface PickPersonalityProps {
    onPersonalityPicked: (personalityIdPicked: string) => void;
    allPersonalities: IPersonality[];
    personalityIdState: string;
    currentUser: IUser;
    languageState: string;
    disableButtons: boolean;
    selectedFilters: PersonalityFilter[];
}

const PickPersonality: React.FC<PickPersonalityProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityIdState,
    currentUser,
    languageState,
    disableButtons,
    selectedFilters,
}) => {
    if (currentUser.user_info?.user_type === "doctor") {
        return (
            <DoctorPersonalities
                onPersonalityPicked={onPersonalityPicked}
                allPersonalities={allPersonalities}
                personalityIdState={personalityIdState}
                languageState={languageState}
                disableButtons={disableButtons}
                selectedFilters={selectedFilters}
            />
        );
    }

    return (
        <UserPersonalities
            onPersonalityPicked={onPersonalityPicked}
            allPersonalities={allPersonalities}
            personalityIdState={personalityIdState}
            languageState={languageState}
            disableButtons={disableButtons}
            selectedFilters={selectedFilters}
        />
    );
};

export default PickPersonality;
