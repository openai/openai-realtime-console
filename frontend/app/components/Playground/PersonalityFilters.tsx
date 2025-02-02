import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { tx } from "@/utils/i18n";
import { X } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { FaHandHoldingMedical } from "react-icons/fa";
import { FaChild } from "react-icons/fa6";

interface PersonalityFiltersProps {
    setSelectedFilters: Dispatch<SetStateAction<PersonalityFilter[]>>;
    selectedFilters: PersonalityFilter[];
    languageState: string;
    currentUser: IUser;
}

const PersonalityFilters = ({
    setSelectedFilters,
    selectedFilters,
    languageState,
    currentUser,
}: PersonalityFiltersProps) => {
    const t = tx(languageState as LanguageCodeType);
    const isDoctor = currentUser.user_info?.user_type === "doctor";

    return (
        <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={selectedFilters}
            onValueChange={(value: string[]) => {
                setSelectedFilters(value as PersonalityFilter[]);
            }}
            className="justify-start mb-4 text-xs mt-2"
        >
            <ToggleGroupItem
                value="is_child_voice"
                aria-label="Toggle children filter"
                className="rounded-full flex items-center gap-2 text-xs [&[data-state=on]]:bg-gray-200"
            >
                <FaChild className="h-4 w-4 text-gray-800" />
                {t("For children")}
                {selectedFilters.includes("is_child_voice") && (
                    <X className="h-4 w-4" aria-hidden="true" />
                )}
            </ToggleGroupItem>
            {!isDoctor && (
                <ToggleGroupItem
                    value="is_doctor"
                    aria-label="Toggle doctors filter"
                    className="rounded-full flex items-center gap-2 text-xs [&[data-state=on]]:bg-gray-200"
                >
                    <FaHandHoldingMedical className="h-4 w-4 text-gray-800" />
                    {t("For doctors")}
                    {selectedFilters.includes("is_doctor") && (
                        <X className="h-4 w-4" aria-hidden="true" />
                    )}
                </ToggleGroupItem>
            )}
        </ToggleGroup>
    );
};

export default PersonalityFilters;
