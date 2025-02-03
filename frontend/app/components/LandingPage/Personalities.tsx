"use client";

import LandingPagePersonalityCard from "./LandingPagePersonalityCard";
import { useEffect, useRef } from "react";

const Personalities = ({
    allPersonalities,
}: {
    allPersonalities: IPersonality[];
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let scrollAmount = 0;
        const scrollStep = 1; // Adjust this value for speed
        const scrollInterval = 20; // Adjust this value for smoothness

        const scroll = () => {
            if (
                scrollContainer.scrollWidth - scrollContainer.clientWidth ===
                scrollAmount
            ) {
                scrollAmount = 0; // Reset scroll
            } else {
                scrollAmount += scrollStep;
            }
            scrollContainer.scrollLeft = scrollAmount;
        };

        const intervalId = setInterval(scroll, scrollInterval);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="relative w-full">
            <div ref={scrollRef} className="overflow-x-auto scrollbar-hide">
                <div className="flex flex-row items-center sm:gap-x-8 gap-x-4 justify-between whitespace-nowrap px-4 py-8">
                    {allPersonalities.map((personality) => (
                        <LandingPagePersonalityCard
                            key={personality.personality_id}
                            personality={personality}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Personalities;
