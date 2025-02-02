import { GeistSans } from "geist/font/sans";
import { Product, WithContext } from "schema-dts";
import {
    Inter,
    Baloo_2,
    Comic_Neue,
    Quicksand,
    Fredoka,
    Lora,
    Inter_Tight,
} from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react";
import Footer from "./components/Footer";
import { fetchGithubStars } from "./actions";
import { Metadata, Viewport } from "next";
import NextTopLoader from "nextjs-toploader";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Karla } from "next/font/google";

const karla = Karla({
	subsets: ["latin"],
	variable: "--font-karla",
});


import Script from "next/script";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const inter_tight = Inter_Tight({
    weight: ["500", "600", "700"],
    style: ["normal", "italic"],
    subsets: ["latin"],
    variable: "--font-inter-tight",
    display: "swap",
});

const baloo2 = Baloo_2({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-baloo2",
});

const comicNeue = Comic_Neue({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-comic-neue",
    weight: ["300", "400", "700"],
});

const quicksand = Quicksand({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-quicksand",
});

const fredoka = Fredoka({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-fredoka",
});

const lora = Lora({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-lora",
});

const fonts = `${inter.variable} ${inter_tight.variable} ${baloo2.variable} ${comicNeue.variable} ${quicksand.variable} ${fredoka.variable} ${lora.variable} ${karla.variable}`;

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: {
        default:
            "Humloop AI: The Compact Device to Bring AI Characters to Life",
        template:
            "%s | Humloop AI - The Compact Device to Bring AI Characters to Life",
    },
    applicationName: "Humloop AI",
    description:
        "Humloop is an AI-enabled device that brings objects to life through conversational AI. More than a device, it's your gateway to a world where AI brings magic to the ordinary.",
    authors: [
        {
            name: "Akashdeep Deb and Junru Xiong",
            url: "https://linkedin.com/in/akashdeep-deb",
        },
    ],
    keywords: [
        "AI toy",
        "AI companion",
        "AI device",
        "interactive learning",
        "empathetic companion",
        "voice assistant",
        "emotional growth",
        "Humloop AI",
        "conversational AI",
        "google home",
        "amazon echo",
        "smart speaker",
        "AI speaker",
        "emotional support",
        "AI for adults",
        "AI assistant",
        "smart AI device",
    ],
    openGraph: {
        title: "Humloop AI: The Compact Device to Bring AI Characters to Life",
        description:
            "Humloop brings objects to life through engaging, conversational AI experiences. More than a device, it's your gateway to a world where AI brings magic to the ordinary.",
        siteName: "Humloop AI",
        locale: "en-US",
        type: "website",
        images: [
            {
                url: "https://Humloop.app/images/orange.png",
                width: 1200,
                height: 630,
                alt: "Humloop AI conversational device - Front View",
            },
        ],
    },
    robots: {
        index: true,
        follow: true,
    },
    generator: "Next.js",
    creator: "Humloop Team",
    publisher: "Humloop AI Ltd.",
    alternates: {
        canonical: "https://Humloop.app",
        languages: {
            "en-US": "https://Humloop.app",
            "zh-CN": "https://Humloop.app",
        },
    },
    icons: {
        icon: "https://Humloop.app/favicon.ico",
        apple: "https://Humloop.app/favicon.ico",
    },
    twitter: {
        card: "summary_large_image",
        title: "Humloop - An AI-powered device that brings objects to life through engaging, conversational experiences",
        description:
            "More than a device, Humloop is your gateway to a world where AI brings magic to the ordinary through engaging learning and interactive experiences.",
        images: ["https://Humloop.app/images/orange.png"],
    },
    assets: "https://Humloop.app/images",
    formatDetection: {
        telephone: false,
    },
    appleWebApp: {
        capable: true,
        title: "Humloop AI",
        statusBarStyle: "black-translucent",
    },
    category: "AI device",
    classification: "Interactive, conversational AI Devices",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

const jsonLd: WithContext<Product> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Humloop AI",
    description:
        "Humloop is an AI-enabled device that brings objects to life through conversational AI. More than a device, it's your gateway to a world where AI brings magic to the ordinary.",
    brand: {
        "@type": "Brand",
        name: "Humloop AI",
    },
    offers: {
        "@type": "Offer",
        url: "https://Humloop.app",
        priceCurrency: "USD",
        price: "57.99",
        priceValidUntil: "2024-12-31", // set a realistic date in the future
        availability: "https://schema.org/InStock",
        seller: {
            "@type": "Organization",
            name: "Humloop AI Ltd.",
        },
        hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            returnPolicyCategory:
                "https://schema.org/MerchantReturnUnspecified",
            merchantReturnDays: 30,
        },
        shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: {
                "@type": "DefinedRegion",
                name: "Worldwide", // Reflects availability in all countries
            },
            shippingRate: {
                "@type": "MonetaryAmount",
                value: "0.00",
                currency: "USD", // Free shipping
            },
        },
    },
    aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        reviewCount: "14",
    },
    review: [
        {
            "@type": "Review",
            author: {
                "@type": "Person",
                name: "Kai L.",
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
            },
            reviewBody:
                "I wished to have a toy for my friends kids, chatting just for fun ... and hearing all is 'out-of-the-.box' is a unbelievable awesome",
        },
        {
            "@type": "Review",
            author: {
                "@type": "Person",
                name: "Lauren A. W.",
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
            },
            reviewBody:
                "I want to make a mini me. I think this box will really help!",
        },
        {
            "@type": "Review",
            author: {
                "@type": "Person",
                name: "Steven Z.",
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: "5",
            },
            reviewBody: "this is fantastic, extremely useful. Thanks so much.",
        },
        {
            "@type": "Review",
            author: {
                "@type": "Person",
                name: "Big cube",
            },
            reviewRating: {
                "@type": "Rating",
                ratingValue: "4.5",
            },
            reviewBody:
                "Really cool project you've got going on, hoping one day it might use a local llm",
        },
    ],
    image: "https://Humloop.app/images/orange.png",
    category: "Interactive AI Device",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();

    const { stars } = await fetchGithubStars("StarmoonAI/Humloop");

    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <html
            lang="en"
            className={`${GeistSans.className} h-full ${fonts}`}
            suppressHydrationWarning
        >
            <head>
                <link rel="canonical" href="https://www.Humloop.app" />
                <Script
                    id="product-schema"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(jsonLd),
                    }}
                />
            </head>
            <body className="bg-background text-foreground flex flex-col min-h-screen bg-gray-50 font-karla">
                <NextTopLoader showSpinner={false} color="#facc15" />

                {/* <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                > */}
                <main className="flex-grow mx-auto w-full flex flex-col">
                    {/* <Navbar user={user} stars={stars} /> */}
                    {children}
                    <Footer />
                </main>
                {/* <Analytics /> */}
                <Toaster />
                {/* </ThemeProvider> */}
            </body>
            <GoogleAnalytics gaId="G-9SG0J71ZQ6" />
        </html>
    );
}
