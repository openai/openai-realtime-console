import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function ForgotPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-row gap-1 items-center">
            Reset Password
            <Sparkles size={20} fill="black" />
          </CardTitle>
          <CardDescription>
            Enter your email to reset your account password.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* <ToyPreview /> */}
          <form className="flex-1 flex flex-col w-full justify-center gap-4">
            <div className="flex flex-col gap-2 [&>input]:mb-3">
              <Label htmlFor="email">Email</Label>
              <Input name="email" placeholder="you@example.com" required />
              <SubmitButton formAction={forgotPasswordAction}>
                Reset Password
              </SubmitButton>
              <FormMessage message={searchParams} />
            </div>
            <div>
              <p className="text-sm text-secondary-foreground">
                Already have an account?{" "}
                <Link className="text-primary underline" href="/login">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
