"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SendHorizonal } from "lucide-react";
import { cn } from "@/lib/utils";
import { businessDemoLink } from "@/lib/data";

interface PreorderButtonProps {
    size: "sm" | "lg";
    className?: string;
    iconOnMobile?: boolean;
}

const GetInTouchButton = ({
    size,
    className,
    iconOnMobile,
}: PreorderButtonProps) => {
    return (
        <Link href={businessDemoLink} passHref>
            <Button
                className={cn(
                    "flex flex-row items-center gap-4 font-medium text-base bg-stone-800 leading-8 rounded-full",
                    iconOnMobile ? "px-3" : "px-4",
                    className
                )}
                size={size}
            >
                {<SendHorizonal size={18} strokeWidth={3} />}
                {!iconOnMobile && <span>Get in touch</span>}
            </Button>
        </Link>
    );
};

export default GetInTouchButton;
