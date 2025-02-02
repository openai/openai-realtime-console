import { createUser, doesUserExist } from "@/db/users";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { defaultPersonalityId, defaultToyId } from "@/lib/data";
import { getBaseUrl } from "@/lib/utils";

export async function GET(request: Request) {
    // The `/auth/callback` route is required for the server-side auth flow implemented
    // by the SSR package. It exchanges an auth code for the user's session.
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const queryParamsToyId = requestUrl.searchParams.get("toy_id");

    // const origin = requestUrl.origin;
    // const origin = "http://localhost:3000";
    const origin = getBaseUrl();

    if (code) {
        const supabase = createClient();
        await supabase.auth.exchangeCodeForSession(code);
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // console.log("user+++++", user);

        if (user) {
            // console.log("user+++++2", user);
            const userExists = await doesUserExist(supabase, user);
            if (!userExists) {
                // Create user if they don't exist
                await createUser(supabase, user, {
                    language_code: "en-US",
                    personality_id:
                        user?.user_metadata?.personality_id ??
                        defaultPersonalityId,
                });

                return NextResponse.redirect(`${origin}/onboard`);
            }
        }
    }

    // URL to redirect to after sign up process completes
    return NextResponse.redirect(`${origin}/home`);
}
