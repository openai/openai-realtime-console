import { Card, CardContent } from "@/components/ui/card";
import { Heart, Zap, MessageSquare } from "lucide-react";

const features = [
    {
        icon: Heart,
        title: "Lightning-Fast, Always Available",
        description:
            "Experience seamless, uninterrupted conversations with enterprise-grade reliability and instant responses.",
        // color: "#ef4444",
    },
    {
        icon: Zap,
        title: "Powerfully Smart",
        description:
            "Engage in meaningful conversations, get help with tasks, or learn something new every day.",
        // color: "#f59e0b",
    },
    {
        icon: MessageSquare,
        title: "Personalized Experience",
        description:
            "The more you interact, the more your Elato AI adapts to your preferences and personality.",
        // color: "#059669",
    },
];

const KeyFeatures = () => {
    return (
        <div className="mb-16">
            <h2 className="text-4xl font-semibold mb-8 text-center">
                Why You&apos;ll Love Elato
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
                {features.map((feature) => (
                    <Card
                        key={feature.title}
                        className="border-none shadow-none"
                    >
                        <CardContent className="pt-6">
                            <feature.icon
                                className={`h-10 w-10 text-primary mb-4`}
                                strokeWidth={1.5}
                            />
                            <h3 className="text-xl font-semibold mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-muted-foreground text-md">
                                {feature.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default KeyFeatures;
