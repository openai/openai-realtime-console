"use client";

import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { defaultPersonalityId, defaultToyId } from "@/lib/data";

interface GoogleLoginButtonProps {
    toy_id?: string;
    personality_id?: string;
}

export const loginWithGoogle = async (
    toy_id: string,
    personality_id: string
) => {
    const supabase = createClient();

    const redirectTo = `${location.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo,
            queryParams: {
                toy_id,
                personality_id,
            },
        },
    });
};

export default function GoogleLoginButton({
    toy_id,
    personality_id,
}: GoogleLoginButtonProps) {
    // console.log("1324355345435", toy_id);
    return (
        <Button
            variant="default"
            onClick={() =>
                loginWithGoogle(
                    toy_id ?? defaultToyId,
                    personality_id ?? defaultPersonalityId
                )
            }
        >
            <FaGoogle className="w-4 h-4 mr-4" />
            <span>Continue with Google</span>
        </Button>
    );
}
