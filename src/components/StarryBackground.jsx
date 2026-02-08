import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const StarryBackground = () => {
    // Generate static stars for background depth
    const stars = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        size: Math.random() * 2 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 5
    })), []);

    // Design elements (orbits/rings)
    const orbits = [
        { size: 400, duration: 40, delay: 0 },
        { size: 600, duration: 60, delay: -10 },
        { size: 900, duration: 90, delay: -20 }
    ];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#020205]">
            {/* Deep Cosmic Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(13,11,35,0.4)_0%,rgba(2,2,5,1)_100%)]" />

            {/* Animated Stars */}
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute bg-white rounded-full"
                    style={{
                        width: star.size,
                        height: star.size,
                        left: star.x + '%',
                        top: star.y + '%',
                        opacity: 0.2
                    }}
                    animate={{
                        opacity: [0.1, 0.4, 0.1],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                        ease: "easeInOut"
                    }}
                />
            ))}

            {/* Design Orbits */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                {orbits.map((orbit, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full border border-white/5"
                        style={{
                            width: orbit.size,
                            height: orbit.size,
                        }}
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: orbit.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: orbit.delay
                        }}
                    >
                        {/* Decorative Dot on Orbit */}
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/20 blur-[1px]" />
                    </motion.div>
                ))}
            </div>

            {/* Subtle Nebula Glows */}
            <div className="absolute top-[10%] left-[5%] w-[600px] h-[600px] bg-primary/10 blur-[150px] rounded-full" />
            <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-accent/5 blur-[130px] rounded-full" />
        </div>
    );
};

export default StarryBackground;
