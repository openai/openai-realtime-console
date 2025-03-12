import { SupabaseClient } from "@supabase/supabase-js";

export const getAllPersonalities = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
        .from("personalities")
        .select(`*`)
        .order("created_at", { ascending: false })
        .is("creator_id", null);
    if (error) {
        console.log("error getAllPersonalities", error);
        return [];
    }

    return data as IPersonality[];
};

export const getMyPersonalities = async (supabase: SupabaseClient, userId: string) => {
    const { data, error } = await supabase
        .from("personalities")
        .select(`*`)
        .eq("creator_id", userId);
        
    if (error) {
        console.log("error getMyPersonalities", error);
        return [];
    }

    return data as IPersonality[];
};
