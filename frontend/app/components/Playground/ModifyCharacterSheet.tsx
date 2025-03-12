import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import Image from "next/image";
import PickVoice from "./PickVoice";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Airplay, Check, MonitorSmartphone, Phone } from "lucide-react";
import { useState } from "react";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { getPersonalityImageSrc } from "@/lib/utils";
import { EmojiComponent } from "./EmojiImage";

interface ModifyCharacterSheetProps {
    openPersonality: IPersonality;
    isCurrentPersonality: boolean;
    children: React.ReactNode;
    onPersonalityPicked: (personalityIdPicked: string) => void;
    languageState: string;
    disableButtons: boolean;
}

const ModifyCharacterSheet: React.FC<ModifyCharacterSheetProps> = ({
    openPersonality,
    isCurrentPersonality,
    children,
    onPersonalityPicked,
    languageState,
    disableButtons,
}) => {
    const [isSent, setIsSent] = useState(false);

    const isDesktop = useMediaQuery("(min-width: 768px)");

    const ButtonsComponent = () => {
        return (
            <div className="flex flex-row gap-4 p-4 ">
                <Button
                    // tabIndex={-1}
                    // autoFocus={false}
                    size="lg"
                    className={`w-full rounded-full text-sm md:text-lg flex flex-row items-center gap-1 md:gap-2 transition-colors duration-300 ${
                        isSent || isCurrentPersonality
                            ? "bg-green-500 hover:bg-green-600"
                            : ""
                    }`}
                    variant={disableButtons ? "upsell_primary" : "default"}
                    disabled={isCurrentPersonality || disableButtons}
                    onClick={() => {
                        setIsSent(true);
                        onPersonalityPicked(openPersonality.personality_id!);
                        setTimeout(() => setIsSent(false), 10000);
                    }}
                >
                    <Check className="flex-shrink-0 h-5 w-5 md:h-6 md:w-6" />
                    {isSent || isCurrentPersonality
                        ? "Live character"
                        : "Chat on device"}
                </Button>
            </div>
        );
    };

    const ContentComponent = () => {
        return (
            <div className="container mx-auto p-4 max-w-4xl">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-full h-[300px] sm:h-[400px]">
                        {openPersonality.creator_id === null ? (
                            <Image
                                src={getPersonalityImageSrc(openPersonality.key)}
                                alt={openPersonality.title}
                                className="rounded-lg object-top sm:object-center object-cover"
                                fill
                                // style={{
                                //     objectFit: "cover",
                            //     objectPosition: "top sm:center",
                            // }}
                            />
                        ) : (
                            <EmojiComponent personality={openPersonality} size={100} />
                        )}
                    </div>
                    <div className="space-y-2 text-left w-full">
                    <div className="flex flex-row items-center gap-2">
                        <h3 className="text-xl font-semibold">
                            {openPersonality.title}
                        </h3>
                    </div>

                    <p className="text-gray-400">
                        {openPersonality.subtitle}
                    </p>
                    <p className="text-gray-600">
                        {openPersonality.short_description}
                    </p>
                </div>
                </div>
            </div>
        );
    };

    if (isDesktop) {
        return (
            <Sheet>
                <SheetTrigger asChild>{children}</SheetTrigger>
                <SheetContent
                    className="rounded-tl-xl gap-0 rounded-bl-xl overflow-y-auto p-0"
                    style={{ maxWidth: "500px" }}
                    side="right"
                >
                    <div className="min-h-[100dvh] flex flex-col">
                        <div className="flex-1">
                            <ContentComponent />
                        </div>
                        <div className="sticky bottom-0 w-full bg-background border-t">
                            <ButtonsComponent />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Drawer>
            <DrawerTrigger asChild>{children}</DrawerTrigger>
            <DrawerContent className="h-[70vh]">
                <div className="flex flex-col h-full overflow-y-auto">
                    <div className="flex-shrink-0">
                        <ButtonsComponent />
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <ContentComponent />
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default ModifyCharacterSheet;
