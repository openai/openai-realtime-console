import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { businessDemoLink, githubPublicLink } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import PreorderButton from "../PreorderButton";
import { NavbarDropdownMenu } from "./NavbarDropdownMenu";
import { FaGithub } from "react-icons/fa";
import PremiumBadge from "../PremiumBadge";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePathname } from "next/navigation";
import GetInTouchButton from "../GetInTouch";
import { CalendarCheck } from "lucide-react";

interface NavbarButtonsProps {
    user: User | null;
    stars: number | null;
    isHome: boolean;
}

const NavbarButtons: React.FC<NavbarButtonsProps> = ({
    user,
    stars,
    isHome,
}) => {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const isHealthcare = usePathname().includes("/healthcare");

    return (
        <div
            className={`flex flex-row sm:gap-2 ${
                isHome ? "gap-2" : ""
            } items-center font-bold text-sm `}
        >
            {isHome && user && (
                <div className="mr-2">
                    <PremiumBadge currentUserId={user.id} />
                </div>
            )}
            {isHealthcare ? (
                <GetInTouchButton size="sm" iconOnMobile={isMobile} />
            ) : (
                <PreorderButton size="sm" buttonText="Buy" iconOnMobile />
            )}

            {!isHome && (
                <Link
                    href={githubPublicLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Visit our GitHub"
                    className="ml-4"
                    // className="bg-nav-bar rounded-full px-3"
                >
                    <Button
                        size="sm"
                        variant={isMobile ? "ghost" : "outline"}
                        className="flex bg-nav-bar border-0 sm:mr-2 sm:border flex-row gap-2 items-center rounded-full"
                    >
                        <FaGithub className="text-xl" />
                        <p className="hidden sm:flex font-normal">GitHub</p>
                        <Separator
                            orientation="vertical"
                            className="hidden sm:flex"
                        />
                        <p className="hidden sm:flex text-xs font-normal">
                            {stars?.toLocaleString() ?? 475}
                        </p>
                    </Button>
                </Link>
            )}
            {!isHome && !isHealthcare && !isMobile && (
                <Link href={businessDemoLink} passHref tabIndex={-1}>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="flex flex-row gap-2 items-center rounded-full bg-nav-bar focus:shadow-none focus-visible:shadow-none"
                    >
                        <CalendarCheck size={20} />
                        <span className="hidden sm:flex font-normal">
                            Business demo
                        </span>
                    </Button>
                </Link>
            )}
            <NavbarDropdownMenu user={user} stars={stars} />
        </div>
    );
};

export default NavbarButtons;
