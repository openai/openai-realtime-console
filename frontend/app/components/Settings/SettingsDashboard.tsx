"use client";

import React, { useState } from "react";
import HomePageSubtitles from "../HomePageSubtitles";
import AppSettings from "./AppSettings";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import PickLanguage from "../Playground/PickLanguage";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface SettingsDashboardProps {
    selectedUser: IUser;
    allLanguages: ILanguage[];
}

const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
    selectedUser,
    allLanguages,
}) => {
    const supabase = createClient();

    const [languageState, setLanguageState] = useState<LanguageCodeType>(
        selectedUser.language_code! // Initial value from props
    );


    const onLanguagePicked = async (languagePicked: LanguageCodeType) => {
        setLanguageState(languagePicked);
        await updateUser(
            supabase,
            {
                language_code: languagePicked,
            },
            selectedUser.user_id
        );
    };

    const LanguagePicker = () => {
        return (
            <PickLanguage
                onLanguagePicked={onLanguagePicked}
                allLanguages={allLanguages}
                languageState={languageState}
                isDisabled={false}
            />
        )
    }

    const Heading = () => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center sm:justify-normal justify-between max-w-screen-sm">
                    <div className="flex flex-row gap-4 items-center justify-between w-full">
                        <h1 className="text-3xl font-normal">Settings</h1>
                        <div className="pt-1 flex flex-row items-center">
                        <Popover>
      <PopoverTrigger asChild>
        <Button variant="link" size="icon">
            <Info size={12} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4 text-xs">
            The AI model will use this language as your character&apos;s default language.
        </div>
      </PopoverContent>
    </Popover>
                            <LanguagePicker />
                        </div>
                    </div>
                </div>
                <HomePageSubtitles user={selectedUser} page="settings" />
            </div>
        );
    };

    return (
        <div className="overflow-hidden pb-2 w-full flex-auto flex flex-col pl-1">
            <AppSettings
                heading={<Heading />}
                selectedUser={selectedUser}
            />
        </div>
    );
};

export default SettingsDashboard;
