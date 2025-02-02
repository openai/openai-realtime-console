import { docsLink } from "@/lib/data";
import { getOpenGraphMetadata } from "@/lib/utils";
import { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Docs",
    ...getOpenGraphMetadata("Docs"),
};

export default async function RootLayout() {
    permanentRedirect(docsLink);
}
