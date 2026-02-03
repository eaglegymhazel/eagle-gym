"use client";

import { useEffect, useState } from "react";

const reviews = [
  "My daughter and niece both age 7 have been coming for about 2 years. My daughter has learned a lot and had loads of fun and my niece who takes it more seriously progressed to the competition class. I like that theres something for all kids regardless of ability they can either go and have fun whilst still learning but if they want to progress they can. - Katie K",
  "Great place for the kids to focus their energy. Very pleased with the development of my wee one. - Stephen Dock",
  "The teacher, Hazel, is fantastic. My three year old loves going each week - Eleanor Rathod",
  "Daughter loves it. Very well organised - Dave Findlay",
  "Excellent gymnastics club. My daughter has been attending classes here for 2 years and loves it! - Deborah Christie",
  "Fantastic coaching and encouragement for young gymnasts - Carol McCord",
  "As a grand parent it was a pleasure to see the children enjoying themselves - John Burgess",
];

export default function ReviewsSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden">
      <div className="mb-4 flex justify-center">
        <span className="text-5xl font-extrabold text-[#2E2A33]/70 sm:text-6xl">
          “
        </span>
      </div>
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {reviews.map((review) => (
          <div
            key={review}
            className="w-full flex-shrink-0 px-6 sm:px-12"
          >
            <p className="text-lg italic text-[#2E2A33]/85 sm:text-xl">
              “{review}”
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
