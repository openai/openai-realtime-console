import Image from "next/image";
import { AudioWaveform, Volume2 } from "lucide-react";
import { getAssistantAvatar, isDefaultVoice } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";

interface PickVoiceProps {
    toyState: Partial<IToy>;
    isDisabled?: boolean;
}

/**
 *
 * NOTE: toy and voice are being used interchangeably here
 */

const PickVoice: React.FC<PickVoiceProps> = ({ toyState, isDisabled }) => {
    return (
        <Select
            onValueChange={(value: string) => {}}
            disabled={isDisabled}
            defaultValue={toyState?.toy_id}
        >
            <SelectTrigger
                disabled={isDisabled}
                className="w-fit rounded-full gap-1 [&>:last-child]:hidden"
            >
                <Volume2 size={14} className="flex-shrink-0" />
                {toyState?.name}
                <Image
                    src={getAssistantAvatar(toyState.image_src!)}
                    width={20}
                    height={20}
                    alt={toyState?.name!}
                    // className="opacity-0"
                />
            </SelectTrigger>
        </Select>
    );
};

export default PickVoice;
