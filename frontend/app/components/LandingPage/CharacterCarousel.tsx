"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getPersonalityImageSrc } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { voiceSampleUrl } from "@/lib/data";

interface LandingPagePersonality {
    key: string;
    name: string;
    description: string;
}

const ChosenPersonalities: LandingPagePersonality[] = [
    {
        key: "geo_guide",
        name: "Travel guide",
        description: "A travel guide who can help you plan your next trip.",
    },
    {
        key: "ironman",
        name: "Ironman",
        description: "A superhero who can help you with your problems.",
    },
    {
        key: "math_wiz",
        name: "Your math tutor",
        description: "A math tutor who can help you with your math problems.",
    },
    {
        key: "master_chef",
        name: "Master chef",
        description: "A master chef who can help you with your cooking.",
    },
    {
        key: "art_guru",
        name: "Art teacher",
        description: "An art guru who can help you with your art.",
    },
    {
        key: "female_lover",
        name: "Romance healer",
        description:
            "A muse of connection who can help you with your love life.",
    },
    {
        key: "male_lover",
        name: "Poet of love",
        description: "A poet of love who can help you with your love life.",
    },
    {
        key: "sherlock",
        name: "SherlockGPT",
        description: "A detective who can help you with your problems.",
    },
    {
        key: "aggie_blood_test_pal",
        name: "Medical buddy",
        description:
            "A medical companion helping kids feel less anxious during procedures.",
    },
];

interface CharacterCarouselCardProps {
    personality: LandingPagePersonality;
}

const CharacterCarouselCard = ({ personality }: CharacterCarouselCardProps) => {
    const [playing, setPlaying] = useState<string | null>(null);
    const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
        null
    );

    const playAudio = (personality: LandingPagePersonality) => {
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

    return (
        <Card className="flex-shrink-0 w-[270px] border-none bg-gray-50">
            <CardContent className="flex flex-row items-start gap-2 p-0 ">
                {/* Circular Avatar */}
                <div className="w-[100px] h-[100px] relative rounded-lg rounded-tr-none rounded-br-none overflow-hidden flex-shrink-0">
                    <Image
                        src={getPersonalityImageSrc(personality.key)}
                        alt={personality.key}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                    />
                    <Button
                        variant="link"
                        size="icon"
                        className="w-fit absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                        onClick={() => playAudio(personality)}
                    >
                        {playing === personality.key ? (
                            <Pause
                                size={24}
                                fill="white"
                                className="text-white"
                            />
                        ) : (
                            <Play
                                size={24}
                                fill="white"
                                className="text-white"
                            />
                        )}
                    </Button>
                </div>

                {/* Text and Play Button */}
                <div className="flex flex-col gap-1 p-2 opacity rounded-lg">
                    <div className="flex flex-row items-center">
                        <h3 className="font-semibold text-sm text-left truncate">
                            {personality.name}
                        </h3>
                    </div>
                    <p className="text-gray-600 text-xs text-left line-clamp-3">
                        {personality.description}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

const CharacterCarousel = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(true);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftShadow(scrollLeft > 0);
            setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener("scroll", handleScroll);
            handleScroll(); // Initial check
            return () =>
                scrollElement.removeEventListener("scroll", handleScroll);
        }
    }, []);

    return (
        <div className="relative max-w-screen-md ml-4 sm:mx-auto">
            <div
                className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
                    showLeftShadow ? "opacity-100" : "opacity-0"
                }`}
            />
            <div
                ref={scrollRef}
                className="flex overflow-x-auto scrollbar-hide gap-4"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {ChosenPersonalities.map((personality, index) => (
                    <CharacterCarouselCard
                        personality={personality}
                        key={index}
                    />
                ))}
            </div>
            <div
                className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
                    showRightShadow ? "opacity-100" : "opacity-0"
                }`}
            />
        </div>

        // <div className="w-full sm:max-w-screen-md mx-auto">
        //     <div className="overflow-x-auto scrollbar-hide">
        //         <div className="flex gap-4 p-4">
        //             {ChosenPersonalities.map((personality, index) => (
        //                 <CharacterCarouselCard
        //                     personality={personality}
        //                     key={index}
        //                 />
        //             ))}
        //         </div>
        //     </div>
        // </div>
    );
};

export default CharacterCarousel;
