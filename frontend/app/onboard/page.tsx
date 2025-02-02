import { createClient } from "@/utils/supabase/server";
import { getUserById } from "@/db/users";
import Steps from "../components/Onboarding/Steps";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const dbUser = user ? await getUserById(supabase, user.id) : undefined;

    return (
        <div className="flex flex-col gap-2">
            {dbUser && <Steps selectedUser={dbUser} />}
        </div>
    );
}
