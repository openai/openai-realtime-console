import Charts from "@/app/components/Insights/Charts";
import { getUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/server";
import HomePageSubtitles from "@/app/components/HomePageSubtitles";
import PremiumBadge from "@/app/components/PremiumBadge";
import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Trends",
    ...getOpenGraphMetadata("Trends"),
};

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;

    return (
        <div className="pb-12 flex flex-col gap-2">
            <div className="flex flex-row items-center gap-4 sm:justify-normal justify-between">
                <h1 className="text-3xl font-normal">Trends and insights</h1>
                {/* <PremiumBadge currentUser={dbUser} /> */}
            </div>
            {dbUser && <HomePageSubtitles user={dbUser} page="track" />}

            <Charts user={dbUser!} filter="days" />
        </div>
    );
}
