import { Separator } from "@/components/ui/separator";
import Image from "next/image";

interface LandingPageSectionProps {
    title: string;
    description: string;
    imageSrc: string;
    isImageRight?: boolean;
}

const IMAGE_SIZE = 600;

const LandingPageSection: React.FC<LandingPageSectionProps> = ({
    title,
    description,
    imageSrc,
    isImageRight,
}) => {
    return (
        <div
            className={`flex flex-col max-w-screen-xl ${
                isImageRight ? "md:flex-row" : "md:flex-row-reverse"
            } gap-10 justify-between mx-auto mb-28 items-center`}
        >
            <Image
                src={imageSrc}
                className="rounded-2xl"
                alt="toy"
                width={IMAGE_SIZE}
                height={IMAGE_SIZE}
                style={{
                    objectFit: "cover",
                }}
            />
            <div className={`flex flex-col gap-4`}>
                <h2 className="text-4xl font-normal">{title}</h2>
                <p className="text-xl font-normal text-gray-500">
                    {description}
                </p>
            </div>
        </div>
    );
};

export default LandingPageSection;
