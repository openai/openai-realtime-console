import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Products",
    description: "Explore our products and find the perfect one for you.",
    ...getOpenGraphMetadata("Products"),
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-1 flex-col mx-auto w-full max-w-[1400px] gap-6 sm:py-6 md:flex-row">
            <div className="md:max-w-screen-lg mx-auto">{children}</div>
        </div>
    );
}
