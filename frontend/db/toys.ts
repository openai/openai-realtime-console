import { SupabaseClient } from "@supabase/supabase-js";

export const getToyById = async (supabase: SupabaseClient, toy_id: string) => {
    const { data, error } = await supabase
        .from("toys")
        .select("*")
        .eq("toy_id", toy_id)
        .single();

    if (error) {
        // console.log("error getToyById", error);
    }

    return data as IToy | undefined;
};

export const getToyByName = async (supabase: SupabaseClient, name: string) => {
    const { data, error } = await supabase
        .from("toys")
        .select("*")
        .eq("name", name)
        .single();

    if (error) {
        // console.log("error getToyByName", error);
    }

    return data as IToy | undefined;
};

export const getAllToys = async (supabase: SupabaseClient) => {
    const { data, error } = await supabase
        .from("toys")
        .select("*")
        .neq("image_src", "");

    if (error) {
        // console.log("error getAllToys", error);
    }

    return data as IToy[];
};

// insert list of toys
export const createToys = async (supabase: SupabaseClient, toys: IToy[]) => {
    const { data, error } = await supabase.from("toys").insert(toys);

    if (error) {
        // console.log("error createToys", error);
    }

    return data;
};
