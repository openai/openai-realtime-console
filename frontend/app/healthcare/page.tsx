import LandingPageSection from "../components/LandingPage/LandingPageSection";
import { Stethoscope } from "lucide-react";
import { Metadata } from "next";
import { getOpenGraphMetadata } from "@/lib/utils";
import ToyPicker from "../components/LandingPage/ToyPicker";
import GetInTouchButton from "../components/GetInTouch";
import { Badge } from "@/components/ui/badge";
export const metadata: Metadata = {
    title: "Pediatric Care",
    ...getOpenGraphMetadata("Pediatric Care"),
};

const Sections = [
    {
        title: "A friendly face in unfamiliar places",
        progress: "Making hospital visits feel less scary",
        description:
            "Our AI companion helps children feel more at ease during medical procedures by explaining things in a friendly, age-appropriate way they can understand.",
        imageSrc: "/growth.jpg",
    },
    {
        title: "Speaking their language",
        progress: "Complex procedures made simple",
        description:
            "Through playful conversation and familiar superhero voices, we help children understand medical procedures in ways that make sense to them.",
        imageSrc: "/learning.jpg",
        isImageRight: true,
    },
    {
        title: "Always there to listen",
        progress: "24/7 emotional support for little warriors",
        description:
            "Whether it's pre-procedure jitters or recovery time, our companion provides constant emotional support and encouragement when children need it most.",
        imageSrc: "/safety.jpg",
    },
    {
        title: "Teamwork with healthcare heroes",
        progress: "Building trust between kids and medical staff",
        description:
            "We help create positive associations with health-play staff, making it easier for children to form trusting relationships with their medical team.",
        imageSrc: "/privacy.jpg",
        isImageRight: true,
    },
];

export default async function Healthcare() {
    return (
        <main className="isolate flex-1 flex flex-col mx-auto w-full max-w-[1440px] gap-6 px-4 my-8">
            <Badge
                variant="outline"
                className="text-xs w-fit self-center font-normal text-stone-600 border-stone-800"
            >
                This product is currently in Beta testing and is not yet
                certified for clinical use.
            </Badge>
            <div className="relative pt-2 flex flex-col items-center gap-8">
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ffae00] to-[#ce96ff] opacity-35 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                    />
                </div>
                <div className="py-4 sm:py-6">
                    <div className="mx-auto max-w-7xl">
                        <div className="mx-auto max-w-4xl text-center">
                            <h1
                                style={{
                                    lineHeight: "1.25",
                                }}
                                className="font-inter text-4xl font-bold inline tracking-tight text-stone-800 sm:text-6xl"
                            >
                                An AI-enabled healthcare{" "}
                                <span className="text-yellow-500">
                                    {"companion toy"}
                                </span>
                            </h1>
                            <p className="mt-6 text-2xl leading-8 text-stone-600">
                                Humloop is a device that makes toys
                                conversational using familiar superhero voices
                                to explain procedures and provide comfort{" "}
                                <Stethoscope
                                    size={28}
                                    strokeWidth={2}
                                    className="inline-block rotate-12"
                                />
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-row justify-center">
                    <GetInTouchButton size="lg" />
                </div>
                <ToyPicker
                    imageSize={280}
                    buttonText={"Play voice"}
                    showHelpText={true}
                />

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ffc038] to-[#f596ff] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
                    />
                </div>
            </div>

            {/* <Preorder /> */}

            <div className="relative -z-10 px-6 lg:px-8 mt-16">
                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 -z-10 flex -translate-y-1/2 transform-gpu justify-center overflow-hidden blur-3xl sm:bottom-0 sm:right-[calc(50%-6rem)] sm:top-auto sm:translate-y-0 sm:transform-gpu sm:justify-end"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(73.6% 48.6%, 91.7% 88.5%, 100% 53.9%, 97.4% 18.1%, 92.5% 15.4%, 75.7% 36.3%, 55.3% 52.8%, 46.5% 50.9%, 45% 37.4%, 50.3% 13.1%, 21.3% 36.2%, 0.1% 0.1%, 5.4% 49.1%, 21.4% 36.4%, 58.9% 100%, 73.6% 48.6%)",
                        }}
                        className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#ffc038] to-[#f596ff] opacity-25"
                    />
                </div>

                <div
                    aria-hidden="true"
                    className="absolute left-1/2 right-0 top-1/2 -z-10 hidden-translate-y-1/2 transform-gpu overflow-hidden blur-3xl sm:block"
                >
                    <div
                        style={{
                            clipPath:
                                "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
                        }}
                        className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#ffc038] to-[#f596ff] opacity-30"
                    />
                </div>
                <div className="flex flex-col">
                    {Sections.map((section, index) => (
                        <LandingPageSection key={index} {...section} />
                    ))}
                </div>
            </div>
        </main>
    );
}
