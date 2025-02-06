"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { encryptSecret, getMacAddressFromDeviceCode, isValidMacAddress } from "@/lib/utils";
import { addUserToDevice, dbCheckUserCode } from "@/db/devices";
import { getSimpleUserById, updateUser } from "@/db/users";


export const signInAction = async (formData: FormData) => {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return encodedRedirect("error", "/login", error.message);
    }

    return redirect("/home");
};

export const forgotPasswordAction = async (formData: FormData) => {
    const email = formData.get("email")?.toString();
    const supabase = createClient();
    const origin = headers().get("origin");
    const callbackUrl = formData.get("callbackUrl")?.toString();

    if (!email) {
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Email is required"
        );
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
    });

    if (error) {
        console.error(error.message);
        return encodedRedirect(
            "error",
            "/forgot-password",
            "Could not reset password"
        );
    }

    if (callbackUrl) {
        return redirect(callbackUrl);
    }

    return encodedRedirect(
        "success",
        "/forgot-password",
        "Check your email for a link to reset your password."
    );
};

export const resetPasswordAction = async (formData: FormData) => {
    const supabase = createClient();

    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!password || !confirmPassword) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password and confirm password are required"
        );
    }

    if (password !== confirmPassword) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Passwords do not match"
        );
    }

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) {
        encodedRedirect(
            "error",
            "/protected/reset-password",
            "Password update failed"
        );
    }

    encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return redirect("/login");
};

export const checkDoctorAction = async (authCode: string) => {
    return authCode === "kiwi-subtle-emu";
};

export const connectUserToDevice = async (
    userId: string,
    userDeviceCode: string
) => {
    const supabase = createClient();

    const isCodeValid = await dbCheckUserCode(supabase, userDeviceCode.trim());
    if (!isCodeValid) {
        return false;
    }

    // if user code is valid, add user to device
    const successfullyAdded = await addUserToDevice(
        supabase,
        userDeviceCode,
        userId
    );
    return successfullyAdded;
};

export const fetchGithubStars = async (repo: string) => {
    try {
        const response = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: {
                Accept: "application/vnd.github.v3+json",
            },
            next: {
                revalidate: 3600,
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.statusText}`);
        }

        const data = await response.json();
        return {
            stars: data.stargazers_count,
            error: null,
        };
    } catch (error) {
        console.error("Error fetching GitHub stats:", error);
        return {
            stars: null,
            error: "Failed to load GitHub stats",
        };
    }
};

export const isPremiumUser = async (userId: string) => {
    const supabase = createClient();
    const dbUser = await getSimpleUserById(supabase, userId);
    return dbUser?.is_premium;
};

export const setDeviceReset = async (userId: string) => {
    const supabase = createClient();
    await supabase
        .from("users")
        .update({ is_reset: true })
        .eq("user_id", userId);
};

export const setDeviceOta = async (userId: string) => {
    const supabase = createClient();
    await supabase.from("users").update({ is_ota: true }).eq("user_id", userId);
};

export async function storeUserApiKey(userId: string, rawApiKey: string) {
    const supabase = createClient();
    const { iv, encryptedData } = encryptSecret(rawApiKey, process.env.ENCRYPTION_KEY!);
  
    const { error } = await supabase
      .from('api_keys')
      .upsert({
        user_id: userId,
        encrypted_key: encryptedData,
        iv: iv,
      });
  
    if (error) {
      console.error('Error inserting or updating user secret:', error);
      throw error;
    }
  
    console.log(`Encrypted API key for user ${userId} stored successfully.`);
  }

  export async function checkIfUserHasApiKey(userId: string): Promise<boolean> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (error) {
        console.error('Error checking if user has API key:', error);
        throw error;
    }

    return data.length > 0;
  }


  export async function registerDevice(userId: string, deviceCode: string) {
    // check if deviceCode is valid mac address
    if (!isValidMacAddress(deviceCode)) {
         return { error: "Invalid device code" };
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('devices')
      .insert({ user_id: userId, user_code: deviceCode.toLowerCase(), mac_address: getMacAddressFromDeviceCode(deviceCode).toUpperCase() }).select();


    if (error) {
        console.log(error)
        return { error: "Error registering device" };
    }

    if (data && data.length > 0) {
        await updateUser(supabase, { device_id: data[0].device_id }, userId);
    }

    return { error: null };
  }
