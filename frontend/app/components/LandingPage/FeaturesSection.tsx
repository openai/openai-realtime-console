"use client";

import {
    AudioWaveform,
    FileSearch2,
    Sparkle,
    Heart,
    MessageSquareHeart,
    ChartScatter,
    Ratio,
} from "lucide-react";

const features = [
    {
        icon: <MessageSquareHeart size={32} strokeWidth={1.7} />,
        progress: "Released",
        name: "Custom AI characters",
        description: "Choose from a variety of AI characters to interact with.",
        source: "images/feature2.png",
    },
    {
        icon: <ChartScatter size={32} strokeWidth={1.7} />,
        progress: "Released",
        name: "Emotion Intelligence",
        description:
            "Understand emotional trends and insights according to real time analytics.",
        source: "images/feature1.png",
    },

    {
        icon: <Ratio size={32} strokeWidth={1.7} />,
        progress: "Released",
        name: "Tiny Size",
        description:
            "As small as the Apple Watch, you can stack the device on any surface.",
        source: "images/feature3.png",
    },
    {
        icon: <AudioWaveform size={32} strokeWidth={1.7} />,
        progress: "In development",
        name: "Custom Voice Clone",
        description: "Customize your AI's voice to match your preference.",
        source: "images/feature4.png",
    },
    {
        icon: <FileSearch2 size={32} strokeWidth={1.7} />,
        progress: "In development",
        name: "Talk to your documents",
        description:
            "Our RAG implementation allows you to talk to your images, videos and documents.",
        source: "images/feature5.png",
    },
    {
        icon: <Sparkle size={32} strokeWidth={1.7} />,
        progress: "In development",
        name: "Agentic AI",
        description:
            "Our agentic AI can help you with your daily tasks and reminders.",
        source: "images/feature6.png",
    },
    // More features...
];

export default function FeaturesSection() {
    return (
        <section className="">
            <div className="max-w-6xl mx-auto py-8 px-4 md:py-12">
                <div className="max-w-3xl mx-auto text-center pb-12 md:pb-20">
                    <h2 className="text-3xl font-medium tracking-tighter sm:text-5xl text-center ">
                        Packed with features
                    </h2>
                    <p className="font-light mt-12 text-lg sm:text-xl leading-8 text-stone-800">
                        We designed our AI platform to be a suitable companion
                        that you can engage with anytime. Here are some of the
                        features that we have implemented and are actively
                        developing.
                    </p>
                </div>
                <ul
                    role="list"
                    className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {features.map((feature) => (
                        <li key={feature.source} className="relative">
                            <div className="bg-white p-[10px] rounded-[30px] shadow-custom_unfocus">
                                <div className="cursor-pointer overflow-hidden rounded-[25px] relative group">
                                    <img
                                        alt=""
                                        src={feature.source}
                                        className="h-[200px] sm:h-full w-full object-cover transition-all duration-300 ease-in-out group-hover:scale-110 opacity-80"
                                    />
                                    <div className="absolute top-0 left-0 text-stone-800 flex flex-col items-start">
                                        <div className="inline-block mx-[10px] mt-3 mb-4">
                                            {feature.icon}
                                        </div>
                                        <p className="text-normal md:text-xl font-bold px-3 py-2">
                                            {feature.name}
                                        </p>
                                        <p className="text-sm pl-3 pr-6 py-1">
                                            {feature.description}
                                        </p>
                                    </div>

                                    <div className="absolute bottom-0 left-0 text-stone-800 flex flex-col items-start">
                                        <p className="text-xs font-light truncate ml-3 mb-4 px-2 py-[2px] border-[1px] border-stone-700 rounded-xl">
                                            {feature.progress}
                                        </p>
                                    </div>
                                    {/* <button
                                        type="button"
                                        className="absolute inset-0 focus:outline-none"
                                    >
                                        <span className="sr-only">
                                            View details for {feature.progress}
                                        </span>
                                    </button> */}
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
