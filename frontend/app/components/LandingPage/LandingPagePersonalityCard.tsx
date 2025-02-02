import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getPersonalityImageSrc } from "@/lib/utils";

const LandingPagePersonalityCard = ({
    personality,
}: {
    personality: IPersonality;
}) => {
    return (
        <Card
            className={cn(
                "p-0 sm:rounded-3xl rounded-xl cursor-pointer min-w-[180px] border-none shadow-none bg-transparent transition-all hover:scale-103 flex flex-col"
            )}
            // onClick={() => onPersonalityPicked(personality)}
        >
            <CardContent className="flex-shrink-0 p-0 h-[180px]">
                <Image
                    src={getPersonalityImageSrc(personality.key)}
                    alt={personality.key}
                    width={180}
                    height={140}
                    className="sm:rounded-3xl rounded-xl w-full h-full object-cover"
                />
            </CardContent>
        </Card>
    );
};

export default LandingPagePersonalityCard;
