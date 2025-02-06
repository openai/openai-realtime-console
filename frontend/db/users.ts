import { type SupabaseClient, type User } from "@supabase/supabase-js";

export const createUser = async (
    supabase: SupabaseClient,
    user: User,
    userProps: Partial<IUser>
) => {
    // console.log("creating user", user, userProps);

    //   return ;
    const { error } = await supabase.from("users").insert([
        {
            user_id: user.id,
            email: user.email,
            supervisor_name: user.user_metadata?.name ?? "",
            supervisee_name: "",
            supervisee_age: 14,
            supervisee_persona: "",
            personality_id: userProps.personality_id, // selecting default personality
            session_time: 0,
            avatar_url:
                user.user_metadata?.avatar_url ??
                `/user_avatar/user_avatar_${Math.floor(Math.random() * 10)}.png`,
        } as IUser,
    ]);

    if (error) {
        // console.log("error", error);
    }
};

export const getSimpleUserById = async (
    supabase: SupabaseClient,
    id: string
) => {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", id)
        .single();

    if (error) {
        console.log("error", error);
    }

    return data as IUser | undefined;
};

export const getUserById = async (supabase: SupabaseClient, id: string) => {
    const { data, error } = await supabase
        .from("users")
        .select(
            `*, personality:personality_id(*), device:devices!users_device_id_fkey(device_id, volume)`
        )
        .eq("user_id", id)
        .single();

    if (error) {
        console.log("error", error);
    }

    return data as IUser | undefined;
};

export const doesUserExist = async (
    supabase: SupabaseClient,
    authUser: User
) => {
    const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

    if (error) {
        console.log("error", error);
    }

    return !!user;
};

export const updateUser = async (
    supabase: SupabaseClient,
    user: Partial<IUser>,
    userId: string
) => {
    const { error } = await supabase
        .from("users")
        .update(user)
        .eq("user_id", userId);
    if (error) {
        // console.log("error", error);
    }
};
