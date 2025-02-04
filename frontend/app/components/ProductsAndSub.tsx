import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Bird, CheckCircle, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Product {
    title: string;
    description: string;
    imageSrc: string;
    features: string[];
    components: string[];
    price: number;
    paymentLink: string;
    originalPrice: number;
    shadow: string;
}

const DeliveryString = "Delivery starting November 2024";
const SubscriptionString =
    "Preorder now to get access to Elato Voice Premium FREE for 2 months. $5/month after.";

const products: Product[] = [
    {
        title: "Elato AI Device",
        description:
            "The Elato AI device provides all AI characters packed into one fully assembled compact device that can be added to any object.",
        imageSrc: "/images/front_view.png",
        features: [
            "Dimensions: 4.5cm x 3.8cm x 1.9cm",
            "Unlimited access to Elato characters till we deliver your device",
            "On-the-go empathic companion for anyone",
            "Access any AI character from the Elato universe",
            "Compact and easy to use",
            "Customizable to fit any object",
            "Over 4 days standby and 6 hours of continuous voice interaction",
            "Understand your conversational insights",
        ],
        components: ["The Elato AI device", "USB-C cable"],
        originalPrice: 89,
        price: 57.99,
        // paymentLink: "https://buy.stripe.com/5kAg0q8dg9SUcCceUU",
        paymentLink: "/products",
        shadow: "0 4px 6px rgba(255, 215, 0, 0.2), 0 8px 24px rgba(218, 165, 32, 0.5) !important;",
    },
    {
        title: "Elato AI DIY Dev Kit",
        description:
            "The Elato AI Dev Kit is a fully programmable set of components for developers to create their own AI characters and integrate them into their projects.",
        imageSrc: "/images/devkit.png",
        features: [
            "All hardware components included in your Elato kit. No soldering required.",
            "Unlimited access to Elato characters on our website till we deliver your device",
            "Tools to create your own AI character",
            "Integrate your AI character into your projects",
            "Access to the Elato AI SDK",
            "Access to the Elato AI Discord community",
        ],
        components: [
            "Mini ESP32-S3 device",
            "Microphone module",
            "Speaker module",
            "Battery module",
            "LED light module",
            "Switch",
            "USB-C cable",
        ],
        originalPrice: 69,
        price: 45.99,
        // paymentLink: "https://buy.stripe.com/eVaeWmdxAc12fOo145",
        paymentLink: "/products",
        shadow: "0 4px 6px rgba(135, 206, 235, 0.2), 0 8px 24px rgba(70, 130, 180, 0.5) !important;",
    },
];

const ProductsAndSub = () => {
    const SubscriptionNode = (
        <p className="inline-block text-sm mt-4">*{SubscriptionString}</p>
    );

    return (
        <div className="flex-auto flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-medium">Products</h1>
                <p className="text-md text-gray-600 inline-block">
                    Choose the product that best fits your needs.
                </p>
            </div>
            <div className="flex flex-col gap-10">
                {products.map((product, index) => (
                    <Card
                        key={`productCard-${index}`}
                        className={`w-full rounded-3xl max-w-2xl overflow-hidden transition-all duration-300 shadow-none`}
                    >
                        <CardHeader className="p-0">
                            <div className="w-full">
                                <Image
                                    src={product.imageSrc}
                                    alt={product.title}
                                    width={600} // Specify desired width
                                    height={400} // Specify desired height
                                    layout="responsive" // Use responsive layout
                                    style={{
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                        </CardHeader>
                        <CardFooter className="flex gap-6 justify-between items-center py-6 sm:px-14  bg-muted/50">
                            <div className="flex flex-row items-baseline gap-2">
                                <div className="text-2xl font-bold">
                                    ${product.price}
                                </div>
                                <div className="text-lg text-muted-foreground opacity-80 line-through">
                                    ${product.originalPrice}
                                </div>
                            </div>

                            <Link href={product.paymentLink} passHref>
                                <Button
                                    size="sm"
                                    variant="primary"
                                    className="rounded-full shadow-xl"
                                >
                                    Preorder Now
                                </Button>
                            </Link>
                        </CardFooter>
                        <CardContent className="sm:p-14 py-14 relative flex flex-col gap-2">
                            <div className="flex flex-row items-center gap-2 absolute top-6 right-6 sm:right-14">
                                <Badge
                                    variant="secondary"
                                    className="text-sm font-medium rounded-lg text-center flex flex-row items-center gap-1"
                                >
                                    <Truck size={16} />{" "}
                                    {"FREE Shipping over $100"}
                                </Badge>
                                <Badge
                                    variant="secondary"
                                    className="text-sm border-0 flex flex-row items-center gap-1 text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-cyan-300 dark:focus:ring-cyan-800 font-medium rounded-lg text-center"
                                >
                                    <Bird size={16} /> {"Early Bird"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="mt-8 flex flex-col gap-2">
                                    <CardTitle className="text-xl font-medium mb-2">
                                        {product.title}
                                    </CardTitle>
                                    <p className="text-md text-muted-foreground">
                                        {product.description}
                                    </p>
                                </div>
                            </div>
                            {SubscriptionNode}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg my-2">
                                        Features
                                    </h3>
                                    <ul className="space-y-4 ml-4">
                                        <li className="flex flex-row gap-1 items-start">
                                            <CheckCircle
                                                style={{
                                                    height: 16,
                                                    width: 16,
                                                }}
                                                strokeWidth={3}
                                                className="mt-0.5 min-h-4 min-w-4 text-green-500 mr-2"
                                            />
                                            <span className="text-sm">
                                                <span>
                                                    Components in package
                                                </span>
                                                :{" "}
                                                {product.components.map(
                                                    (components, index) => (
                                                        <span
                                                            key={
                                                                "components_" +
                                                                index
                                                            }
                                                            className="mr-2"
                                                        >
                                                            {index + 1}.{" "}
                                                            {components}
                                                        </span>
                                                    )
                                                )}
                                            </span>
                                        </li>
                                        {product.features.map(
                                            (feature, index) => (
                                                <li
                                                    key={"feature_" + feature}
                                                    className="flex flex-row gap-1 items-start"
                                                >
                                                    <CheckCircle
                                                        style={{
                                                            height: 16,
                                                            width: 16,
                                                        }}
                                                        strokeWidth={3}
                                                        className="mt-0.5 min-h-4 min-w-4 text-green-500 mr-2"
                                                    />
                                                    <span className="text-sm">
                                                        {feature}
                                                    </span>
                                                </li>
                                            )
                                        )}
                                    </ul>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground absolute bottom-6 right-6 sm:right-14">
                                {DeliveryString}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ProductsAndSub;
