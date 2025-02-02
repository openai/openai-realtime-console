import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SidebarNav } from "../components/Nav/SidebarNavItems";
import { Flame, Gamepad2, Settings } from "lucide-react";
import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";
import { MobileNav } from "../components/Nav/MobileNav";
import { getUserById } from "@/db/users";
import { tx } from "@/utils/i18n";

const ICON_SIZE = 20;

export const dynamic = "force-dynamic";
export const revalidate = 60;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
    title: "Home",
    ...getOpenGraphMetadata("Home"),
};

const sidebarNavItems = (languageCode: LanguageCodeType) => {
    const t = tx(languageCode);
    return [
        {
            title: t("Playground"),
            href: "/home",
            icon: <Gamepad2 size={ICON_SIZE} />,
        },
        {
            title: t("Trends"),
            href: "/home/track",
            icon: <Flame size={ICON_SIZE} />,
        },
        {
            title: t("Settings"),
            href: "/home/settings",
            icon: <Settings size={ICON_SIZE} />,
        },
    ];
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

    const dbUser = await getUserById(supabase, user.id);

    if (!dbUser) {
        redirect("/login");
    }

    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1400px] gap-2 py-2 md:flex-row">
            <aside className="w-full md:w-[270px] sm:py-6 pt-2 md:overflow-y-auto md:fixed md:h-screen">
                <SidebarNav items={sidebarNavItems(dbUser.language_code)} />
            </aside>
            <main className="flex-1 sm:py-6 px-4 flex justify-center md:ml-[270px]">
                <div className="max-w-5xl w-full">{children}</div>
            </main>
            <MobileNav items={sidebarNavItems(dbUser.language_code)} />
        </div>
    );
}
