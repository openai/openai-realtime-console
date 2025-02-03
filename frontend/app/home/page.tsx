import { createUser, doesUserExist, getUserById } from "@/db/users";
import { getAllToys } from "@/db/toys";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Playground from "../components/Playground/PlaygroundComponent";
import { defaultPersonalityId, defaultToyId } from "@/lib/data";
import { getAllPersonalities } from "@/db/personalities";
import { getAllLanguages } from "@/db/languages";
// import { getAllLanguages } from "@/db/languages";

export const revalidate = 0; // disable cache for this route
export const dynamic = "force-dynamic";

export default async function Home() {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    if (user) {
        const userExists = await doesUserExist(supabase, user);
        // await supabase.auth.signOut();
        if (!userExists) {
            // Create user if they don't exist
            await createUser(supabase, user, {
                personality_id:
                    user?.user_metadata?.personality_id ?? defaultPersonalityId,
                language_code: "en-US",
            });
            redirect("/onboard");
        }
    }

    const dbUser = await getUserById(supabase, user!.id);
    const allPersonalities = await getAllPersonalities(supabase);

    return (
        <div>
            {dbUser && (
                <Playground
                    allPersonalities={allPersonalities}
                    currentUser={dbUser}
                />
            )}
        </div>
    );
}
