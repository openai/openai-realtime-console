import SettingsDashboard from "@/app/components/Settings/SettingsDashboard";
import { getUserById } from "@/db/users";
import { getOpenGraphMetadata } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings",
    ...getOpenGraphMetadata("Settings"),
};

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : null;

    return (
        <div className="pb-4 flex flex-col gap-2">
            {dbUser && <SettingsDashboard selectedUser={dbUser} />}
        </div>
    );
}
