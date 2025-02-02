import { SupabaseClient } from "@supabase/supabase-js";
export const getAllLanguages = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase.from("languages").select("*");
    if (error) {
        throw error;
    }
    return data as ILanguage[];
};
