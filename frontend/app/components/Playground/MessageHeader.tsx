import Image from "next/image";

interface MessageHeaderProps {
    personality: IPersonality;
}

const MessageHeader: React.FC<MessageHeaderProps> = ({
    personality,
}) => {
    return (
        <div className="flex items-center p-4 sm:border-none bg-white rounded-2xl max-w-screen-md mt-2">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                <Image
                    src={`/personality/${personality.key}.jpeg`}
                    alt={personality.title}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    priority
                />
            </div>
            <div className="ml-4 flex-grow">
                <h2 className="font-semibold text-gray-900">
                    {personality.title}
                </h2>
                <p className="text-sm text-gray-500">
                    {personality.subtitle}
                </p>
            </div>
        </div>
    );
};

export default MessageHeader;
