"use client";

import { Badge } from "@/components/ui/badge";
import { getSimpleUserById } from "@/db/users";
import { createClient } from "@/utils/supabase/client";
import { Crown } from "lucide-react";
import { useEffect, useState } from "react";

interface PremiumBadgeProps {
    currentUserId: string;
    displayText?: boolean;
}

const PremiumBadge: React.FC<PremiumBadgeProps> = ({
    currentUserId,
    displayText,
}) => {
    const [dbUser, setDbUser] = useState<IUser | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const getDbUser = async () => {
            const dbUser = await getSimpleUserById(supabase, currentUserId);
            setDbUser(dbUser ?? null);
        };
        getDbUser();
    }, [currentUserId]);

    if (!dbUser || !dbUser?.is_premium) {
        return null;
    }

    return (
        <Badge
            className="flex flex-row gap-2 items-center rounded-sm border-0"
            variant="outline"
        >
            <Crown size={14} fill="#eab308" className="text-yellow-500" />
            {displayText && (
                <span className="text-yellow-500 text-sm font-medium">
                    Premium
                </span>
            )}
        </Badge>
    );
};

export default PremiumBadge;
