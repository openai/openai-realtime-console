"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Dot } from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: SidebarNavItem[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    const primaryItem = (item: SidebarNavItem) => {
        return <Link
        key={item.href}
        href={item.href}
        className={cn(
            buttonVariants({ variant: "primary" }),
            pathname === item.href ? "bg-muted shadow-xl" : "",
            "w-fit justify-start rounded-full text-sm sm:text-xl text-normal text-white bg-yellow-500 hover:bg-yellow-400"
        )}
    >
        <span className="mr-2">{item.icon}</span>
        {item.title}
    </Link>
    }

    return (
        <nav
            className={cn(
                "max-w-[220px] mx-auto hidden md:flex space-x-2 justify-between px-4 sm:justify-evenly md:justify-start md:flex-col md:space-x-0 md:space-y-6 rounded-xl",
                className
            )}
            {...props}
        >
            {items.map((item) => {
                if (item.isPrimary) {
                    return primaryItem(item);
                }
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            buttonVariants({ variant: "ghost" }),
                            pathname === item.href ? "bg-muted" : "",
                            "justify-start rounded-full text-sm sm:text-xl text-normal text-stone-700"
                        )}
                    >
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                        {pathname === item.href && (
                            <Dot className="hidden sm:block flex-shrink-0" size={48} />
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
