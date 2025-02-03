import { SupabaseClient } from "@supabase/supabase-js";

export const getAllPersonalities = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.from("personalities").select("*");
    if (error) {
        console.log("error getAllPersonalities", error);
        return [];
    }

    return data as IPersonality[];
};
