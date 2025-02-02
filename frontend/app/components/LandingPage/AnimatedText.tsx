"use client";
import React, { useState, useEffect, useRef } from "react";
import Typed from "typed.js";

const AnimatedText: React.FC = () => {
    const el = useRef(null);

    useEffect(() => {
        const options = {
            strings: [
                '<span class=""> companionship</span>',
                '<span class=""> IoT applications</span>',
                '<span class=""> entertainment</span>',
                '<span class=""> engaging learning</span>',
                '<span class=""> emotional care</span>',
                '<span class=""> psychological support</span>',
            ],
            typeSpeed: 50,
            backSpeed: 0,
            backDelay: 1000,
            fadeOut: true,
            fadeOutDelay: 1,
            loop: true,
        };

        const typed = new Typed(el.current, options);

        return () => {
            typed.destroy();
        };
    }, []);

    return (
        <h1 className="text-3xl font-semibold">
            <span ref={el} />
        </h1>
    );
};

export default AnimatedText;
