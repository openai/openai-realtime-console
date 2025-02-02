import Image, { StaticImageData } from "next/image";

interface usecaseProps {
    usecase: {
        image: StaticImageData;
    };
}

export default function Usecase({ usecase }: usecaseProps) {
    return (
        <div className="rounded w-[22rem] border border-transparent">
            <div className="flex items-center mb-4 ">
                <Image
                    className="shrink-0 rounded-[30px]"
                    src={usecase.image}
                    alt="Usecase Image"
                />
            </div>
        </div>
    );
}
