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
import { CircleCheck } from "lucide-react";

interface SheetWrapperProps {
    personality: IPersonality;
    personalityIdState: string;
    onPersonalityPicked: (personalityId: string) => void;
    startCall: (personalityId: string) => void;
    languageState: LanguageCodeType;
    disableButtons: boolean;
}

const SheetWrapper: React.FC<SheetWrapperProps> = ({
    personality,
    personalityIdState,
    onPersonalityPicked,
    startCall,
    languageState,
    disableButtons,
}) => {
    return (
        <ModifyCharacterSheet
            key={personality.personality_id}
            openPersonality={personality}
            languageState={languageState}
            isCurrentPersonality={
                personalityIdState === personality.personality_id
            }
            onPersonalityPicked={onPersonalityPicked}
            startCall={startCall}
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
                <CardContent className="flex-shrink-0 p-0 h-[160px] sm:h-[180px]">
                    <Image
                        src={getPersonalityImageSrc(personality.key)}
                        alt={personality.key}
                        width={100}
                        height={180}
                        className="rounded-3xl rounded-br-none rounded-bl-none w-full h-full object-cover"
                    />
                </CardContent>
                <CardHeader className="flex-shrink-0 gap-0 px-4 py-2">
                    <CardTitle className="font-semibold text-md flex flex-row items-center gap-2">
                        {personality.title}{" "}
                        {personalityIdState === personality.personality_id && (
                            <CircleCheck
                                size={20}
                                className="text-white flex-shrink-0"
                                fill="black"
                            />
                        )}
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
