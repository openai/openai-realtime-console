"use client";

import React, { useState } from "react";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import HomePageSubtitles from "./HomePageSubtitles";

interface SettingsDashboardProps {
    selectedUser: IUser;
    allLanguages: ILanguage[];
}

const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
    selectedUser,
    allLanguages,
}) => {
    const supabase = createClient();

    const [languageState, setLanguageState] = useState<string>(
        selectedUser.language_code! // Initial value from props
    );


    const onLanguagePicked = async (languagePicked: string) => {
        setLanguageState(languagePicked);
        await updateUser(
            supabase,
            {
                language_code: languagePicked,
            },
            selectedUser.user_id
        );
    };

    const Heading = () => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center sm:justify-normal justify-between max-w-screen-sm">
                    <div className="flex flex-row gap-4 items-center justify-between w-full">
                        <h1 className="text-3xl font-normal">Create your AI Character</h1>
                    </div>
                </div>
                <HomePageSubtitles user={selectedUser} page="create" />
            </div>
        );
    };

    return (
        <div className="overflow-hidden pb-2 w-full flex-auto flex flex-col pl-1">
            <Heading />
        </div>
    );
};

export default SettingsDashboard;
