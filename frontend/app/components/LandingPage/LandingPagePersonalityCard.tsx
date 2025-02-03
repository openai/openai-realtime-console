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
                "p-0 rounded-full cursor-pointer sm:min-w-[180px] min-w-[120px] border-none shadow-none bg-transparent transition-all hover:scale-103 flex flex-col"
            )}
            // onClick={() => onPersonalityPicked(personality)}
        >
            <CardContent className="flex-shrink-0 p-0 sm:h-[180px] h-[120px]">
                <Image
                    src={getPersonalityImageSrc(personality.key)}
                    alt={personality.key}
                    width={180}
                    height={140}
                    className="rounded-full w-full h-full object-cover"
                />
            </CardContent>
        </Card>
    );
};

export default LandingPagePersonalityCard;
