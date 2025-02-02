"use client";

import IllustrationInsights from "@/public/insights_section.svg";

import InsightsDemo from "./InsightsDemo";

export default function InsightsDemoSection() {
    return (
        <section className="">
            <div className="relative w-full max-w-[1440px] mx-auto">
                <div
                    className="absolute -top-[85px] pointer-events-none -z-10 opacity-90 w-full h-[650px] bg-cover bg-center bg-no-repeat blur-xl"
                    style={{
                        backgroundImage: `url(${IllustrationInsights.src})`,
                        transform: "scaleX(-1)",
                    }}
                    aria-hidden="true"
                ></div>
            </div>

            <div className="py-8 px-4 md:py-12">
                <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
                    <h2 className="text-3xl font-medium tracking-tighter sm:text-5xl text-center ">
                        Get trends and insights
                    </h2>
                    <p className="font-light mt-12 text-lg sm:text-xl leading-8 text-stone-800">
                        Our AI platform can analyse human-speech and emotion,
                        and respond with empathy, offering supportive
                        conversations and personalized learning assistance.
                    </p>
                </div>
                <div className="max-w-[1120px] mx-auto px-6 sm:px-20 py-6 sm:py-12 bg-white shadow-custom_focus rounded-[40px] md:border-[22px] border-[12px] border-zinc-800">
                    <InsightsDemo />
                </div>
            </div>
        </section>
    );
}
