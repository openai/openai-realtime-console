import React from "react";
import { motion } from "framer-motion";

const AnimatedBlob = ({ isConnecting }: { isConnecting: boolean }) => {
    if (!isConnecting) return null;

    return (
        <div className="flex justify-center items-center h-full w-full mt-10">
            <motion.div
                initial={{
                    scale: 0.8,
                    opacity: 0.6,
                    borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
                }}
                animate={{
                    scale: [0.8, 1.2, 0.9, 1.1, 1],
                    opacity: [0.6, 0.8, 0.6, 0.9, 0.7],
                    borderRadius: [
                        "40% 60% 70% 30% / 40% 50% 60% 50%",
                        "60% 40% 30% 70% / 60% 30% 50% 40%",
                        "50% 50% 50% 50% / 50% 50% 50% 50%",
                        "30% 70% 60% 40% / 50% 60% 40% 50%",
                        "40% 60% 70% 30% / 40% 50% 60% 50%",
                    ],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                }}
                className="w-32 h-32 bg-[#ffc038]"
            />
        </div>
    );
};

export default AnimatedBlob;
