import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Slide = {
  img: string;
  text: string[];
};

const defaultSlides: Slide[] = [
  {
    img: "https://cdn.cosmos.so/8b0252bd-cb64-45f4-aef8-672c7f628f76?format=jpeg",
    text: ["BETWEEN SHADOW", "AND LIGHT"],
  },
  {
    img: "https://cdn.cosmos.so/7b3f4c48-ec63-4bac-b472-910c037a0eb4?format=jpeg",
    text: ["SILENCE SPEAKS", "THROUGH FORM"],
  },
  {
    img: "https://cdn.cosmos.so/444502b9-4cb9-4f14-a068-f0213df08729?format=jpeg",
    text: ["ESSENCE BEYOND", "PERCEPTION"],
  },
  {
    img: "https://cdn.cosmos.so/ef511e17-a35b-42e6-9122-2754bbd2ad7e?format=jpeg",
    text: ["TRUTH IN", "EMPTINESS"],
  },
  {
    img: "https://cdn.cosmos.so/cf68a397-080a-437a-994e-69dedd9e6e06?format=jpeg",
    text: ["SURRENDER TO", "THE VOID"],
  },
];

interface SlideshowProps {
  slides?: Slide[];
  autoPlayInterval?: number;
  className?: string;
}

export default function Slideshow({
  slides = defaultSlides,
  autoPlayInterval = 6000,
  className = "",
}: SlideshowProps) {
  const [current, setCurrent] = useState(0);

  const nextSlide = useCallback(
    () => setCurrent((prev) => (prev + 1) % slides.length),
    [slides.length],
  );
  const prevSlide = useCallback(
    () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length),
    [slides.length],
  );

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(timer);
  }, [nextSlide, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [nextSlide, prevSlide]);

  return (
    <div
      className={`relative w-full h-[70vh] md:h-[85vh] lg:h-screen overflow-hidden bg-black ${className}`}
      role="region"
      aria-label="Image slideshow"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`
            absolute inset-0 bg-cover bg-center
            transition-all duration-[800ms] ease-in-out
            ${i === current ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-105"}
          `}
          style={{ backgroundImage: `url(${slide.img})` }}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${i + 1} of ${slides.length}`}
          aria-hidden={i !== current}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Slide text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            {slide.text.map((t, j) => (
              <span
                key={j}
                className={`
                  text-white font-bold tracking-[0.15em] text-center
                  text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-tight
                  transition-all duration-700 delay-300
                  ${i === current ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
                `}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="
          absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20
          size-10 md:size-12 rounded-full
          bg-white/10 backdrop-blur-sm border border-white/20
          flex items-center justify-center
          text-white/70 hover:text-white hover:bg-white/20
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
        "
        aria-label="Previous slide"
      >
        <ChevronLeft className="size-5 md:size-6" />
      </button>

      <button
        onClick={nextSlide}
        className="
          absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20
          size-10 md:size-12 rounded-full
          bg-white/10 backdrop-blur-sm border border-white/20
          flex items-center justify-center
          text-white/70 hover:text-white hover:bg-white/20
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
        "
        aria-label="Next slide"
      >
        <ChevronRight className="size-5 md:size-6" />
      </button>

      {/* Counter */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20">
        <span className="text-white/60 text-xs md:text-sm tracking-[0.2em] font-light">
          {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`
              size-1.5 md:size-2 rounded-full transition-all duration-300
              ${i === current ? "bg-white w-4 md:w-6" : "bg-white/40 hover:bg-white/60"}
            `}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
