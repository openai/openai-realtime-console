import ModifyCharacterSheet from "./ModifyCharacterSheet";
import Image from "next/image";
import { cn, getPersonalityImageSrc } from "@/lib/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Check, CheckCircle, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SheetWrapperProps {
    personality: IPersonality;
    personalityIdState: string;
    onPersonalityPicked: (personalityId: string) => void;
    languageState: string;
    disableButtons: boolean;
}

const SheetWrapper: React.FC<SheetWrapperProps> = ({
    personality,
    personalityIdState,
    onPersonalityPicked,
    languageState,
    disableButtons,
}) => {
    const isCurrentPersonality = personalityIdState === personality.personality_id;
    return (
        <ModifyCharacterSheet
            key={personality.personality_id}
            openPersonality={personality}
            languageState={languageState}
            isCurrentPersonality={isCurrentPersonality}
            onPersonalityPicked={onPersonalityPicked}
            disableButtons={disableButtons}
        >
            <Card
                className={cn(
                    "p-0 rounded-3xl cursor-pointer shadow-lg transition-all hover:scale-103 flex flex-col",
                    personalityIdState === personality.personality_id
                        ? "border-primary border-2"
                        : "hover:border-primary/50"
                )}
                // onClick={() => onPersonalityPicked(personality)}
            >
                <CardContent className="flex-shrink-0 p-0 h-[160px] sm:h-[180px] relative">
                    <Image
                        src={getPersonalityImageSrc(personality.key)}
                        alt={personality.key}
                        width={100}
                        height={180}
                        className="rounded-3xl rounded-br-none rounded-bl-none w-full h-full object-cover"
                    />
                    <Button
                        size="sm"
                        variant={isCurrentPersonality ? "default" : "outline"}
                        className={`absolute shadow-lg top-2 right-2 rounded-full h-9 w-9 p-0 ${isCurrentPersonality ? "bg-primary text-primary-foreground" : ""}`}
                        onClick={() => onPersonalityPicked(personality.personality_id)}
                        aria-label={isCurrentPersonality ? "Deselect feature" : "Select feature"}
                    >
                        {true ? (
                            <Check className="h-4 w-4" strokeWidth={3} />
                        ) : (
                            <CheckCircle className="h-4 w-4" strokeWidth={3} />
                        )}
                    </Button>
                </CardContent>
                <CardHeader className="flex-shrink-0 gap-0 px-4 py-2">
                    <CardTitle className="font-semibold text-md flex flex-row items-center gap-2">
                        {personality.title}  
                    </CardTitle>
                    <CardDescription className="text-sm font-normal">
                        {personality.subtitle}
                    </CardDescription>
                </CardHeader>
            </Card>
        </ModifyCharacterSheet>
    );
};

export default SheetWrapper;
