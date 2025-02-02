"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreorderButtonProps {
    size: "sm" | "lg";
    buttonText: string;
    className?: string;
    iconOnMobile?: boolean;
}

const PreorderButton = ({
    size,
    buttonText,
    className,
    iconOnMobile,
}: PreorderButtonProps) => {
    const textSize = size == "sm" ? "text-sm" : "text-base";
    return (
        <Link href="/products" passHref>
            <Button
                className={cn(
                    "flex flex-row items-center gap-2 font-medium text-base bg-stone-800 leading-8 rounded-full px-4",
                    iconOnMobile ? "p-2 sm:p-4" : "",
                    className
                )}
                size={size}
            >
                <ShoppingCart size={20} />
                {
                    <span
                        className={`${iconOnMobile ? "hidden sm:block" : ""} ${textSize}`}
                    >
                        {buttonText}
                    </span>
                }
            </Button>
        </Link>
    );
};

export default PreorderButton;
