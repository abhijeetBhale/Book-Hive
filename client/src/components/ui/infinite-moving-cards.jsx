import { cn } from "../../lib/utils";
import React, { useEffect, useState, Fragment, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar, faStarHalfAlt } from "@fortawesome/free-solid-svg-icons";
import VerifiedBadge from './VerifiedBadge';

const Rating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => {
      const index = i + 1;
      let content = "";
      if (index <= Math.floor(rating))
        content = (
          <FontAwesomeIcon
            icon={faStar}
            className="text-[18px] text-yellow-500"
          />
        );
      else if (rating > i && rating < index + 1)
        content = (
          <FontAwesomeIcon
            icon={faStarHalfAlt}
            className="text-[18px] text-yellow-500"
          />
        );
      else if (index > rating)
        content = (
          <FontAwesomeIcon
            icon={faStar}
            className="text-[18px] text-yellow-200"
          />
        );
      return <Fragment key={i}>{content}</Fragment>;
    })}
  </div>
);

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className
}) => {
  const containerRef = useRef(null);
  const scrollerRef = useRef(null);
  const [start, setStart] = useState(false);
  const isDuplicatedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !scrollerRef.current) return;

    // Set animation properties
    if (direction === "left") {
      containerRef.current.style.setProperty("--animation-direction", "forwards");
    } else {
      containerRef.current.style.setProperty("--animation-direction", "reverse");
    }

    if (speed === "fast") {
      containerRef.current.style.setProperty("--animation-duration", "20s");
    } else if (speed === "normal") {
      containerRef.current.style.setProperty("--animation-duration", "40s");
    } else {
      containerRef.current.style.setProperty("--animation-duration", "80s");
    }

    // Only duplicate once
    if (!isDuplicatedRef.current) {
      const timer = setTimeout(() => {
        if (scrollerRef.current && !isDuplicatedRef.current) {
          const scrollerContent = Array.from(scrollerRef.current.children);

          // Duplicate items for infinite scroll
          scrollerContent.forEach((item) => {
            const duplicatedItem = item.cloneNode(true);
            if (scrollerRef.current) {
              scrollerRef.current.appendChild(duplicatedItem);
            }
          });

          isDuplicatedRef.current = true;
          setStart(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    } else {
      // If already duplicated, just start the animation
      setStart(true);
    }
  }, [direction, speed]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 w-full overflow-hidden",
        className
      )}
      style={{
        maskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, white 20%, white 80%, transparent)"
      }}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-10 py-8",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{
          animation: start ? `scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite` : 'none'
        }}
      >
        {items.map((item, idx) => (
          <li
            className="relative w-[400px] max-w-full shrink-0 rounded-xl bg-white shadow-xl border border-gray-100 p-6 hover:-translate-y-1 duration-300"
            key={`${item.name}-${idx}`}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="mr-3">
                  <img
                    src={item.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff`}
                    alt={item.name}
                    className="w-12 h-12 rounded-full border border-gray-200 object-cover"
                  />
                </div>
                <div>
                  <h5 className="text-lg font-medium text-gray-900 flex items-center gap-1.5">
                    {item.name}
                    {item.isVerified && <VerifiedBadge size={16} />}
                  </h5>
                  {item.title && (
                    <p className="text-sm text-gray-500">{item.title}</p>
                  )}
                </div>
              </div>
              <Rating rating={item.rating || 5} />
            </div>
            <p className="leading-[1.8] text-gray-600">{item.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};
