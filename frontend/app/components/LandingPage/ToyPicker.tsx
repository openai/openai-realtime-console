"use client";

import { Button } from "@/components/ui/button";
import { voiceSampleUrl } from "@/lib/data";
import { ArrowRight, PauseIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ToyPickerProps {
    imageSize: number;
    buttonText: string;
    showHelpText: boolean;
}

interface IDoctorPersonality {
    key: string;
    name: string;
}

const getDoctorImageSrc = (key: string) => {
    return "/personality/" + key + ".jpeg";
};

const DoctorPersonalities: IDoctorPersonality[] = [
    {
        key: "aggie_blood_test_pal",
        name: "Aggie Blood Test Pal",
    },
    {
        key: "santa_claus",
        name: "Santa Claus",
    },
    {
        key: "luna_epilepsy_pal",
        name: "Luna Epilepsy Pal",
    },
];

const ToyPicker: React.FC<ToyPickerProps> = ({ imageSize, buttonText }) => {
    const [selectedPersonality, setSelectedPersonality] =
        useState<IDoctorPersonality>(DoctorPersonalities[0]);

    const [playing, setPlaying] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
        null
    );

    const playAudio = (personality: IDoctorPersonality) => {
        if (playing === personality.key && audioElement) {
            // Pause current audio
            audioElement.pause();
            setPlaying(null);
            setAudioElement(null);
            return;
        }

        // Stop any currently playing audio
        if (audioElement) {
            audioElement.pause();
        }

        const audio = new Audio(`${voiceSampleUrl}${personality.key}.wav`);
        audio.onended = () => {
            setPlaying(null);
            setAudioElement(null);
        };
        audio.play();
        setPlaying(personality.key);
        setAudioElement(audio);
    };

    const onClickSelectedPersonality = (personality: IDoctorPersonality) => {
        setSelectedPersonality(personality);
    };

    return (
        <div className="flex flex-col-reverse gap-8 pb-6">
            <div className="flex md:mt-7- md:flex-row flex-col gap-8 items-center justify-center">
                {DoctorPersonalities.map((personality) => {
                    const chosen = selectedPersonality?.key === personality.key;
                    return (
                        <div
                            key={personality.key}
                            className="flex flex-col gap-2 bg-gray-50- rounded-2xl"
                        >
                            <div
                                className={`flex flex-col items-center max-w-[300px] max-h-[300px] rounded-br-2xl gap-2 mb-4 rounded-xl overflow-hidden cursor-pointer transition-colors duration-200 ease-in-out`}
                                onClick={() =>
                                    onClickSelectedPersonality(personality)
                                }
                            >
                                <Image
                                    src={getDoctorImageSrc(personality.key)}
                                    width={imageSize}
                                    height={imageSize}
                                    alt={personality.name}
                                    className="rounded-2xl transition-transform duration-300 ease-in-out scale-90 transform hover:scale-100 hover:-rotate-2"
                                />
                            </div>
                            <div className="flex flex-col gap-6 items-center text-center">
                                <div className={`text-xl font-medium`}>
                                    {personality.name}
                                </div>
                                {chosen && (
                                    <>
                                        <Button
                                            onClick={() => {
                                                // play sound
                                                playAudio(personality);
                                            }}
                                            variant="outline"
                                            className="font-medium text-lg flex flex-row gap-2 items-center rounded-full border-stone-800 border-2"
                                        >
                                            <span>
                                                {playing
                                                    ? "Pause voice"
                                                    : buttonText}
                                            </span>
                                            {playing ? (
                                                <PauseIcon
                                                    size={18}
                                                    fill="currentColor"
                                                />
                                            ) : (
                                                <PlayIcon
                                                    size={18}
                                                    fill="currentColor"
                                                />
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* {showHelpText && (
        <p className="flex self-center text-sm text-gray-600">
          (pick your favorite AI character to get started!)
        </p>
      )} */}
        </div>
    );
};

export default ToyPicker;
