import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Login",
    ...getOpenGraphMetadata("Login"),
};

export default async function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1440px] min-h-screen items-center justify-center px-4">
        <div className="w-full flex justify-center">{children}</div>
    </div>
    );
}
