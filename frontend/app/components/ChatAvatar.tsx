import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    getAssistantAvatar,
    getPersonalityImageSrc,
    getUserAvatar,
} from "@/lib/utils";

interface ChatAvatarProps {
    role: string;
    user: IUser;
    personalityTranslation: IPersonalitiesTranslation;
}

const ChatAvatar: React.FC<ChatAvatarProps> = ({
    role,
    user,
    personalityTranslation,
}) => {
    const imageSrc: string =
        role === "input"
            ? getUserAvatar(user.avatar_url)
            : `/personality/${personalityTranslation.personality_key}.jpeg`;

    return (
        <Avatar className="h-10 w-10">
            <AvatarImage
                src={imageSrc}
                alt="@shadcn"
                className="object-contain"
            />
            <AvatarFallback className="text-sm">
                {user.email.slice(0, 2).toUpperCase()}
            </AvatarFallback>
        </Avatar>
    );
};

export default ChatAvatar;
