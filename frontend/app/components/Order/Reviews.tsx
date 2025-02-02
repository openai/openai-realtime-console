import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const reviews = [
    {
        name: "Kai L.",
        title: "Parent, Tinkerer",
        comment:
            "I wished to have a toy for my friends kids, chatting just for fun ... and hearing all is 'out-of-the-box' is unbelievable, awesome!",
        rating: 5,
        avatar: "KL",
    },
    {
        name: "Lauren A. W.",
        title: "Tech Enthusiast",
        comment: "I want to make a mini me. I think this box will really help!",
        rating: 5,
        avatar: "LA",
    },
    {
        name: "Steven Z.",
        title: "Tech Enthusiast",
        comment: "This is fantastic, extremely useful. Thanks so much.",
        rating: 4.5,
        avatar: "SZ",
    },
    {
        name: "Z Xavi",
        title: "Tech Enthusiast",
        comment:
            "I really see the value in what you're doing, ... it's an open source thing ... that is a truly commendable aim",
        rating: 5,
        avatar: "ZX",
    },
];

const Reviews = () => {
    return (
        <div className="mb-16 rounded-2xl p-4">
            <h2 className="text-4xl font-semibold mb-8 text-center">
                From our early users
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
                {reviews.map((testimonial, index) => (
                    <Card
                        key={index}
                        className="relative backdrop-blur-sm bg-white border-none shadow-none transition-all duration-300"
                    >
                        <CardContent className="pt-6 ">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-primary font-medium">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <p className="font-semibold">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonial.title}
                                    </p>
                                </div>
                            </div>
                            <p className="mb-4 text-sm leading-relaxed">
                                {testimonial.comment}
                            </p>
                            <div className="absolute bottom-4 right-4 flex items-center gap-1">
                                {/* <span className="text-sm">
                                    {testimonial.rating}
                                </span> */}
                                {/* <Star
                                    className={`h-4 w-4 text-yellow-500 fill-yellow-500`}
                                /> */}
                                {/* {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`h-4 w-4 ${
                                            i < testimonial.rating
                                                ? "text-yellow-500 fill-yellow-500"
                                                : "text-primary/20"
                                        }`}
                                    />
                                ))} */}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Reviews;
