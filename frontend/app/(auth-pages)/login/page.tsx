import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { SubmitButton } from "./submit-button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import GoogleLoginButton from "../../components/GoogleLoginButton";

interface LoginProps {
  searchParams?: { [key: string]: string | string[] | undefined };
}

export default async function Login({ searchParams }: LoginProps) {
  const toy_id = searchParams?.toy_id as string | undefined;
  const personality_id = searchParams?.personality_id as string | undefined;
  const isGoogleOAuthEnabled = process.env.GOOGLE_OAUTH === "True";
  // const supabase = createClient();

  // const {
  //     data: { user },
  // } = await supabase.auth.getUser();

  // if (user) {
  //     return redirect("/home");
  // }

  const signInOrSignUp = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = createClient();

    // Try to sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // If sign in succeeds, redirect to home
    if (!signInError) {
      return redirect("/home");
    }

    // If sign in fails, try to sign up
    const origin = headers().get("origin");
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          toy_id: toy_id,
          personality_id: personality_id,
        },
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (signUpError) {
      return redirect(`/login?message=${signUpError.message}`);
    }

    // if (process.env.NEXT_PUBLIC_ENV === "local") {
    //   return redirect("/login?message=Sussessfully signed up");
    // } else {
    //   return redirect("/login?message=Check email to continue sign in process");
    // }

    return redirect("/login?message=Check email to continue sign in process");
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Card className="sm:border-2 border-0 sm:bg-white bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="flex flex-row gap-1 items-center">
            Login to Elato
            <Sparkles size={20} fill="black" />
          </CardTitle>
          <CardDescription>
            Login or sign up your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* <ToyPreview /> */}

          {isGoogleOAuthEnabled && (
            <GoogleLoginButton
              toy_id={toy_id}
              personality_id={personality_id}
            />
          )}

          <Separator className="mt-2" />
          <form className="flex-1 flex flex-col w-full justify-center gap-4">
            <Label className="text-md" htmlFor="email">
              Email
            </Label>
            <input
              className="rounded-md px-4 py-2 bg-inherit border"
              name="email"
              placeholder="you@example.com"
              required
            />
            <Label className="text-md" htmlFor="email">
              Password
            </Label>

            <input
              className="rounded-md px-4 py-2 bg-inherit border"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />

            {/* {process.env.NEXT_PUBLIC_ENV !== "local" && (
              <Link
                className="text-xs text-foreground underline"
                href="/forgot-password"
              >
                Forgot Password?
              </Link>
            )} */}

            <Link
              className="text-xs text-foreground underline"
              href="/forgot-password"
            >
              Forgot Password?
            </Link>

            <SubmitButton
              formAction={signInOrSignUp}
              className="text-sm font-medium bg-gray-100 hover:bg-gray-50 dark:text-stone-900 border-[0.1px] rounded-md px-4 py-2 text-foreground my-2"
              pendingText="Signing In..."
            >
              Continue with Email
            </SubmitButton>
            {searchParams?.message && (
              <p className="p-4 rounded-md border bg-green-50 border-green-400 text-gray-900 text-center text-sm">
                {searchParams.message}
              </p>
            )}
            {/* <Messages /> */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
