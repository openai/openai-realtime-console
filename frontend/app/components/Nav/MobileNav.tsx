"use client";

import { usePathname } from "next/navigation";

export function MobileNav({
    items,
}: {
    items: {
        title: string;
        href: string;
        icon: React.ReactNode;
    }[];
}) {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden">
            <div className="flex justify-around items-center h-14">
                {items.map((item) => (
                    <a
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center p-2 text-sm"
                    >
                        {pathname === item.href && (
                            <div className="absolute top-5 left-1/2 w-[35px] h-[45px] -translate-x-1/2 -translate-y-1/2 -rotate-[70deg] rounded-[100%_80%_100%_80%] bg-yellow-100 -z-[1]" />
                        )}
                        <div
                            className={`${pathname === item.href ? "text-yellow-600" : "text-gray-500"}`}
                        >
                            {item.icon}
                        </div>
                        <span
                            className={`mt-1 text-xs ${pathname === item.href ? "text-yellow-600 font-medium" : "text-gray-500"}`}
                        >
                            {item.title}
                        </span>
                    </a>
                ))}
            </div>
        </nav>
    );
}
