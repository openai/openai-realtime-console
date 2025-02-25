import FluidAISpeakingAnimation from "../components/Realtime/Animation";
import FluidBubbleAnimation from "../components/Realtime/Animation1";

export default async function Home() {
    return (
        <div className="flex flex-col gap-2">
            {/* <FluidAISpeakingAnimation /> */}
            <FluidBubbleAnimation />
        </div>
    );
}
