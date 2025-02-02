"use client";

import { useEffect } from "react";
import Image from "next/image";
import Product1 from "@/public/images/decomposation_view.gif";
import Product2 from "@/public/images/front_view.png";

// Import Swiper
import Swiper from "swiper";
import { Pagination, EffectFade } from "swiper/modules";
// import Swiper and modules styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import Personalities from "./Personalities";
Swiper.use([Pagination, EffectFade]);

interface CharacterPickerProps {
    allPersonalities: IPersonality[];
}

export default function CharacterPicker({
    allPersonalities,
}: CharacterPickerProps) {
    useEffect(() => {
        const character = new Swiper(".character-carousel", {
            slidesPerView: 1,
            watchSlidesProgress: true,
            effect: "fade",
            fadeEffect: {
                crossFade: true,
            },
            pagination: {
                el: ".character-carousel-pagination",
                clickable: true,
            },
        });
    }, []);

    return (
        <section>
            <div className="relative max-w-7xl gap-8 mx-auto text-center flex flex-col items-center justify-center">
                {/* Carousel */}

                <div
                    className="w-full md:w-3/5 md:mr-8 mb-8 md:mb-0 flex-shrink-0 h-[450px] shadow-custom"
                    data-aos="fade-up"
                    data-aos-anchor="[data-aos-id-6]"
                >
                    <div className="character-carousel swiper-container max-w-sm mx-auto sm:max-w-none h-[450px] rounded-[30px]">
                        <div className="swiper-wrapper">
                            {/* corp */}
                            {/* Card #1 */}
                            <div className="swiper-slide w-full h-full flex-shrink-0 relative">
                                <Image
                                    src={Product2}
                                    alt="Products all colors"
                                    sizes="100vw"
                                    fill
                                    style={{
                                        objectPosition: "center",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                            <div className="swiper-slide w-full h-full flex-shrink-0 relative">
                                <div className="rounded-[30px] overflow-hidden w-full h-full">
                                    <Image
                                        src={Product1}
                                        alt="Product decomposition view"
                                        sizes="100vw"
                                        fill
                                        style={{
                                            objectPosition: "center",
                                            objectFit: "contain",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* corp */}
                            {/* no Card #2 */}
                        </div>
                    </div>

                    {/* Bullets */}
                    <div className="">
                        <div className="character-carousel-pagination text-center" />
                    </div>
                </div>
            </div>
        </section>
    );
}
