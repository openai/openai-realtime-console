import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

const images = [
    {
        src: "/products/box43.png",
        alt: "Elato Device - white",
        objectFit: "contain",
    },
    // {
    //     src: "/products/multi3.png",
    //     alt: "Elato Device Decomposition",
    //     objectFit: "contain",
    // },
    {
        src: "/products/multi3.png",
        alt: "Elato Device - gray",
        objectFit: "contain",
    },
    {
        src: "/products/multi2.png",
        alt: "Elato Device - black",
        objectFit: "contain",
    },
    // {
    //     src: "/products/orange.jpg",
    //     alt: "Elato AI Device",
    //     objectFit: "contain",
    // },
    // {
    //     src: "/products/multi_black.jpg",
    //     alt: "Elato Device Decomposition",
    //     objectFit: "contain",
    // },
    // {
    //     src: "/products/multi.jpg",
    //     alt: "Holding the device",
    //     objectFit: "cover",
    // },
    // {
    //     src: "/products/multi2_black.jpg",
    //     alt: "Toys with insights",
    //     objectFit: "contain",
    // },
    // {
    //     src: "/products/pink.jpg",
    //     alt: "Using it with toys",
    //     objectFit: "contain",
    // },
    // {
    //     src: "/products/gray_black.jpg",
    //     alt: "Using it with toys",
    //     objectFit: "cover",
    // },
];

const ProductImageCarousel = () => {
    return (
        <Carousel
            opts={{
                loop: true,
                align: "start",
                skipSnaps: false,
                dragFree: false,
            }}
            // autoplay={true}
            autoplayInterval={4000}
            className="w-full max-w-xl mx-auto"
        >
            <CarouselContent>
                {images.map((image, index) => (
                    <CarouselItem key={index}>
                        <div className="relative h-[250px] sm:h-[400px] w-full">
                            <Image
                                src={image.src}
                                alt={image.alt}
                                className="sm:rounded-lg shadow-lg"
                                fill
                                style={{
                                    objectFit: image.objectFit as
                                        | "cover"
                                        | "contain",
                                }}
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
        </Carousel>
    );
};

export default ProductImageCarousel;
