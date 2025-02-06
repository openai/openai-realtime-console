import { SupabaseClient } from "@supabase/supabase-js";

export const dbCheckUserCode = async (
    supabase: SupabaseClient,
    userCode: string
) => {
    const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_code", userCode)
        .maybeSingle();

    if (error) {
        throw error;
    }
    return !!data;
};

export const updateDevice = async (
    supabase: SupabaseClient,
    device: Partial<IDevice>,
    device_id: string
) => {
    const { error } = await supabase.from("devices").update(device).eq("device_id", device_id);
    if (error) {
        throw error;
    }
};

export const addUserToDevice = async (
    supabase: SupabaseClient,
    userCode: string,
    userId: string
) => {
    const { error } = await supabase
        .from("devices")
        .update({ user_id: userId })
        .eq("user_code", userCode);

    if (error) {
        return false;
    }

    return true;
};

export const doesUserHaveADevice = async (
    supabase: SupabaseClient,
    userId: string
) => {
    const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return !!data;
};
