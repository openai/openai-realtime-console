"use client";

import Image1 from "@/public/images/usecase1.png";
import Image2 from "@/public/images/usecase2.png";
import Image3 from "@/public/images/usecase3.png";
import Image4 from "@/public/images/usecase4.png";
import Illustration from "@/public/usecase_section.svg";

import Usecase from "./Usecase";

export default function Usecases() {
    const usecases01 = [
        {
            image: Image1,
            name: "Lina James",
            user: "@linaj87",
            link: "#0",
            content:
                "Extremely thoughtful approaches to business. I highly recommend this product to anyone wanting to jump into something new.",
        },
        {
            image: Image2,
            name: "Lina James",
            user: "@linaj87",
            link: "#0",
            content:
                "Extremely thoughtful approaches to business. I highly recommend this product to anyone wanting to jump into something new.",
        },
        {
            image: Image3,
            name: "Lina James",
            user: "@linaj87",
            link: "#0",
            content:
                "Extremely thoughtful approaches to business. I highly recommend this product to anyone wanting to jump into something new.",
        },
        {
            image: Image4,
            name: "Mary Kahl",
            user: "@marykahl",
            link: "#0",
            content:
                "Extremely thoughtful approaches to business. I highly recommend this product to anyone wanting to jump into something new.",
        },
    ];

    return (
        <section className="">
            {/* Illustration */}
            {/* <div className="relative w-full max-w-[1440px] mx-auto">
        <div
          className="absolute left-1/2  -translate-x-1/2 pointer-events-none -z-10 opacity-90 w-full h-[350px] bg-cover bg-center bg-no-repeat blur-2xl"
          style={{ backgroundImage: `url(${Illustration.src})` }}
          aria-hidden="true"
        ></div>
      </div> */}
            <div className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
                        <h2 className="font-inter-tight text-3xl md:text-4xl font-semibold text-stone-800">
                            A variety of use cases
                        </h2>
                        <p className="font-light mt-12 text-lg sm:text-xl leading-8 text-stone-800">
                            Use Humloop as an add-on to real-life objects to
                            create interactive games and stories. Bring your
                            things such as toys to life by giving them a voice
                            and a curated personality.
                        </p>
                    </div>
                </div>
                <div className="w-full mx-auto space-y-6 ">
                    {/* Row #1 */}
                    {/* <div className="w-full inline-flex flex-nowrap overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_5%,_black_calc(100%-5%),transparent_100%)] group"> */}
                    <div className="w-full inline-flex flex-nowrap overflow-hidden group">
                        <div className="flex items-start justify-center md:justify-start [&>div]:mx-3 animate-infinite-scroll group-hover:[animation-play-state:paused]">
                            {/* Items */}
                            {usecases01.map((usecase, index) => (
                                <Usecase key={index} usecase={usecase} />
                            ))}
                        </div>
                        {/* Duplicated element for infinite scroll */}
                        <div
                            className="flex items-start justify-center md:justify-start [&>div]:mx-3 animate-infinite-scroll group-hover:[animation-play-state:paused]"
                            aria-hidden="true"
                        >
                            {/* Items */}
                            {usecases01.map((usecase, index) => (
                                <Usecase key={index} usecase={usecase} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
