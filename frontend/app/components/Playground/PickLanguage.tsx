import { Languages } from "lucide-react";
// import twemoji from "twemoji";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import Twemoji from "react-twemoji";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface PickLanguageProps {
    onLanguagePicked: (languagePicked: LanguageCodeType) => void;
    allLanguages: ILanguage[];
    languageState: LanguageCodeType;
    isDisabled?: boolean;
}

const PickLanguage: React.FC<PickLanguageProps> = ({
    onLanguagePicked,
    allLanguages,
    languageState,
    isDisabled,
}) => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const languageSelected = allLanguages.find(
        (language) => language.code === languageState
    );

    const FlagComponent = ({ flag }: { flag: string | undefined }) => {
        return (
            <div className="w-5 h-5 flex items-center justify-center">
                <Twemoji
                    options={{ className: "twemoji w-5 h-5 flex-shrink-0" }}
                >
                    {flag}
                </Twemoji>
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-2">
            <Select
                onValueChange={(value: string) => {
                    onLanguagePicked(value as LanguageCodeType);
                }}
                defaultValue={languageState}
            >
                <SelectTrigger
                    disabled={isDisabled}
                    className="rounded-full gap-2 w-fit  [&>:last-child]:hidden sm:[&>:last-child]:block"
                >
                    <Languages size={18} />
                    <FlagComponent flag={languageSelected?.flag} />
                    {!isMobile && <span>{languageState}</span>}
                </SelectTrigger>
                <SelectContent>
                    {allLanguages.map((language) => (
                        <SelectItem
                            key={language.language_id}
                            value={language.code}
                            className="p-2 flex justify-center"
                        >
                            <div className="flex flex-row items-center gap-2">
                                <FlagComponent flag={language.flag} />
                                <div className="flex flex-col text-sm items-start">
                                    <p>{language.code}</p>
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default PickLanguage;
