"use client";

import { motion } from "framer-motion"; // Add this import at the top
import Image from "next/image";

export const DeviceImage = () => {
    return (
        <div className="relative h-[260px] w-full items-center -mt-8">
            <motion.div
                animate={{
                    y: [-5, 5, -5],
                }}
                transition={{
                    duration: 4,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
                className="w-full h-full"
            >
                <Image
                    src="/products/box43.png"
                    alt="Elato AI Device"
                    fill
                    className="object-contain object-center mr-6 rounded-3xl"
                />
            </motion.div>
        </div>
    );
};

export default DeviceImage;
