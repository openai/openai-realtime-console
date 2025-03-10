import BuildDashboard from "@/app/components/BuildDashboard";
import { getAllLanguages } from "@/db/languages";
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
    const allLanguages = await getAllLanguages(supabase);

    return (
        <div className="pb-4 flex flex-col gap-2">
            {dbUser && (
                <BuildDashboard
                    selectedUser={dbUser}
                    allLanguages={allLanguages}
                />
            )}
        </div>
    );
}
