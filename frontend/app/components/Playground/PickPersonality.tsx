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
    myPersonalities: IPersonality[];
}

const PickPersonality: React.FC<PickPersonalityProps> = ({
    onPersonalityPicked,
    allPersonalities,
    personalityIdState,
    currentUser,
    languageState,
    disableButtons,
    selectedFilters,
    myPersonalities,
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
                myPersonalities={myPersonalities}
            />
        );
    }

    return (
        <UserPersonalities
            myPersonalities={myPersonalities}
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
