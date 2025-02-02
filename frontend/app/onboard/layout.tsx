import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";

export const metadata: Metadata = {
    title: "Onboard",
    ...getOpenGraphMetadata("Onboard"),
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1400px] gap-6 py-2 sm:py-4 md:flex-row">
            <div className="md:max-w-screen-lg mx-auto">
                <div className="block space-y-6 p-6 md:p-12 pb-16">
                    <div className="flex flex-col space-y-8 md:flex-row md:space-x-12 md:space-y-0">
                        <div className="flex-1 ">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
