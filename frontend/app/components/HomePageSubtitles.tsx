import { tx } from "@/utils/i18n";
import CreditsRemaining from "./CreditsRemaining";
interface HomePageSubtitlesProps {
    user: IUser;
    page: "home" | "settings" | "track";
    languageCode?: LanguageCodeType;
}

const HomePageSubtitles: React.FC<HomePageSubtitlesProps> = ({
    user,
    page,
    languageCode = "en-US",
}) => {
    const t = tx(languageCode);

    if (user.user_info.user_type === "doctor") {
        if (page === "home") {
            return (
                <p className="text-sm text-gray-600">
                    {t(
                        "Use this playground or your device to engage your patients"
                    )}
                </p>
            );
        } else if (page === "track") {
            return (
                <p className="text-sm text-gray-600">
                    {t("Track your patients' progress and trends here")}
                </p>
            );
        } else {
            return (
                <p className="text-sm text-gray-600">
                    {t("You can update your settings below")}
                </p>
            );
        }
    }

    // if they are a regular user
    return <CreditsRemaining user={user} languageCode={languageCode} />;
};

export default HomePageSubtitles;
