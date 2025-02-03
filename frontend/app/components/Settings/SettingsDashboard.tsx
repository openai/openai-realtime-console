"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import HomePageSubtitles from "../HomePageSubtitles";
import AppSettings from "./AppSettings";
import { toast } from "@/components/ui/use-toast";
import { updateUser } from "@/db/users";
import { createClient } from "@/utils/supabase/client";

interface SettingsDashboardProps {
    selectedUser: IUser;
}

const SettingsDashboard: React.FC<SettingsDashboardProps> = ({
    selectedUser,
}) => {
    const Heading = () => {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-4 items-center sm:justify-normal justify-between max-w-screen-sm">
                    <div className="flex flex-row gap-4 items-center">
                        <h1 className="text-3xl font-normal">Settings</h1>
                        {/* <div className="flex flex-row gap-4 justify-between items-center">
                            <SaveButton />
                        </div> */}
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
