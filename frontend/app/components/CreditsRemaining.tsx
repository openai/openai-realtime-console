"use client";

import { Button } from "@/components/ui/button";
import { getCreditsRemaining } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import AddCreditsModal from "./Upsell/AddCreditsModal";

const CreditsRemaining: React.FC<{
    user: IUser;
    languageCode: string;
}> = ({ user, languageCode }) => {
    const creditsRemaining = getCreditsRemaining(user);
    const hasNoCredits = creditsRemaining <= 0;

    if (user.is_premium) {
        return null;
    }

    return (
        <div className="flex flex-row items-center gap-4">
            <p
                className={`text-sm ${hasNoCredits ? "text-gray-400" : "text-gray-400"}`}
            >
                {creditsRemaining} {"credits remaining"}
            </p>
            {creditsRemaining <= 50 && (
                <AddCreditsModal>
                    <Button
                        variant="upsell_link"
                        className="flex flex-row items-center gap-2 pl-0"
                        size="sm"
                    >
                        <Sparkles size={16} />
                        {hasNoCredits
                            ? "Upgrade to continue"
                            : "Get unlimited access"}
                    </Button>
                </AddCreditsModal>
            )}
        </div>
    );
};

export default CreditsRemaining;
