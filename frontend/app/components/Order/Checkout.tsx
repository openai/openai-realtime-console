"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { DEVICE_COST, ORIGINAL_COST } from "@/lib/data";
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { useToast } from "@/components/ui/use-toast";

const colors: { display: ProductColor; value: string }[] = [
    { display: "white", value: "#fff" },
    { display: "gray", value: "#ddd" },
    { display: "black", value: "#111" },
];

const Checkout = () => {
    const { toast } = useToast();

    const [numberOfUnits, setNumberOfUnits] = useState(1);
    const [productColor, setProductColor] = useState<ProductColor>("white");

    const incrementUnits = () => {
        setNumberOfUnits((prev) => prev + 1);
    };

    const decrementUnits = () => {
        setNumberOfUnits((prev) => Math.max(1, prev - 1));
    };

    const deviceCost = numberOfUnits * DEVICE_COST;
    const originalCost = numberOfUnits * ORIGINAL_COST;
    const totalSavings = originalCost - deviceCost;

    const freeShipping = deviceCost >= 100;

    const handleCheckout = async () => {
        try {
            const response = await fetch("/api/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quantity: numberOfUnits,
                    color: productColor,
                    free_shipping: freeShipping,
                }),
            });

            if (!response.ok) {
                throw new Error();
            }

            const { url } = await response.json();
            window.location.href = url;
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Payment Error",
                description:
                    "There was an error processing your payment. Please try again or reach out if this persists.",
            });
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4 flex-wrap">
                <div className="text-3xl font-semibold">${deviceCost}</div>
                <div className="text-lg font-medium text-gray-400 line-through">
                    ${originalCost}
                </div>
                <Badge variant="secondary" className="font-medium rounded-md">
                    Save ${totalSavings.toFixed(0)}
                </Badge>
            </div>
            <div className="flex flex-row items-center gap-4">
                <div className="flex gap-2">
                    {colors.map((color) => (
                        <HoverCard key={color.value}>
                            <HoverCardTrigger asChild>
                                <button
                                    key={color.value}
                                    onClick={() =>
                                        setProductColor(color.display)
                                    }
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                                        productColor === color.display
                                            ? "border-yellow-500 scale-110"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    style={{
                                        backgroundColor: color.value,
                                        boxShadow:
                                            color.display === "white"
                                                ? "inset 0 0 0 1px #e5e7eb"
                                                : "none",
                                    }}
                                    aria-label={`Select ${color.display} color`}
                                />
                            </HoverCardTrigger>
                            <HoverCardContent className="text-xs w-fit bg-black text-white p-1">
                                <div>{color.display}</div>
                            </HoverCardContent>
                        </HoverCard>
                    ))}
                </div>
                {freeShipping && (
                    <p className="text-sm text-gray-400">FREE Shipping</p>
                )}
            </div>

            <div className="flex items-center gap-4 mb-6">
                {/* <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-md">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={decrementUnits}
                            className="h-10 px-3 hover:bg-gray-100"
                        >
                            <Minus className="h-4 w-4" />
                        </Button>

                        <input
                            type="number"
                            value={numberOfUnits}
                            onChange={(e) =>
                                setNumberOfUnits(
                                    Math.max(1, parseInt(e.target.value) || 1)
                                )
                            }
                            className="w-16 text-center border-x bg-white h-10 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            min="1"
                        />

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={incrementUnits}
                            className="h-10 px-3 hover:bg-gray-100"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div> */}

                <Button
                    size="lg"
                    className="w-full h-10 rounded-full"
                    // variant="upsell_primary"
                    onClick={handleCheckout}
                >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Preorder Now
                </Button>
            </div>
        </div>
    );
};

export default Checkout;
