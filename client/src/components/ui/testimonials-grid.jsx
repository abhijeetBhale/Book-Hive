import React, { Fragment, useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleLeft,
  faAngleRight,
  faStar,
  faStarHalfAlt,
} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import PropTypes from "prop-types";

const Rating = ({ rating, showLabel, className, ...rest }) => (
  <p className={classNames("flex flex-wrap gap-0.5", className)} {...rest}>
    <span>
      {[...Array(5)].map((_, i) => {
        const index = i + 1;
        let content = "";
        if (index <= Math.floor(rating))
          content = (
            <FontAwesomeIcon
              icon={faStar}
              className="text-[22px] text-yellow-500"
            />
          );
        else if (rating > i && rating < index + 1)
          content = (
            <FontAwesomeIcon
              icon={faStarHalfAlt}
              className="text-[22px] text-yellow-500"
            />
          );
        else if (index > rating)
          content = (
            <FontAwesomeIcon
              icon={faStar}
              className="text-[22px] text-yellow-200 dark:text-opacity-20"
            />
          );
        return <Fragment key={i}>{content}</Fragment>;
      })}
    </span>
    {showLabel && <span>{rating.toFixed(1)}</span>}
  </p>
);

Rating.propTypes = {
  rating: PropTypes.number.isRequired,
  showLabel: PropTypes.bool,
  className: PropTypes.string,
};

const TestimonialItem = ({ item }) => {
  const { rating, content, photo, name } = item;
  return (
    <div className="bg-white shadow-xl rounded-xl hover:-translate-y-1 h-full duration-300 p-6 border border-gray-100">
      <div className="mt-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="mr-2">
              <img
                src={photo}
                alt={name}
                className="max-w-full h-auto rounded-full border border-gray-200"
                width="47"
              />
            </div>
            <div>
              <h5 className="text-xl break-all font-medium text-gray-900">{name}</h5>
            </div>
          </div>
          <Rating rating={rating} showLabel={false} />
        </div>
        <p className="leading-[1.8] text-gray-600 mb-6">{content}</p>
      </div>
    </div>
  );
};

TestimonialItem.propTypes = {
  item: PropTypes.object.isRequired,
};

const TestimonialsGrid = ({ testimonials = [] }) => {
  const [testimonialList, setTestimonialList] = useState([]);
  const [index, setIndex] = useState(0);

  // Convert testimonials to the required format and group them in pairs
  useEffect(() => {
    if (testimonials && testimonials.length > 0) {
      // Map testimonials to the required format
      const formattedTestimonials = testimonials.map(t => ({
        photo: t.avatar || t.src,
        name: t.user || t.name,
        rating: t.rating || 5,
        content: t.review || t.quote || t.content,
      }));

      // Group testimonials in pairs for the grid layout
      const grouped = [];
      for (let i = 0; i < formattedTestimonials.length; i += 2) {
        grouped.push(formattedTestimonials.slice(i, i + 2));
      }
      
      setTestimonialList(grouped);
    } else {
      // Default testimonials if none provided
      const defaultTestimonials = [
        [
          {
            photo: "https://cdn.easyfrontend.com/pictures/testimonial/testimonial_square_1.jpeg",
            name: "Akshay Kumar",
            rating: 3.5,
            content: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Delectus magni tempore provident? Quaerat, dicta saepe praesentium eaque nobis corrupti aut, quibusdam provident consequatur.",
          },
          {
            photo: "https://cdn.easyfrontend.com/pictures/testimonial/testimonial_square_3.jpeg",
            name: "Arjun Kapur",
            rating: 4.5,
            content: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Delectus magni tempore provident? Quaerat, dicta saepe praesentium eaque nobis corrupti aut, quibusdam provident consequatur.",
          },
        ],
        [
          {
            photo: "https://cdn.easyfrontend.com/pictures/testimonial/testimonial_square_2.jpeg",
            name: "Raima Sen",
            rating: 5,
            content: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Delectus magni tempore provident? Quaerat, dicta saepe praesentium eaque nobis corrupti aut, quibusdam provident consequatur.",
          },
          {
            photo: "https://cdn.easyfrontend.com/pictures/testimonial/testimonial_square_1.jpeg",
            name: "Akshay Kumar",
            rating: 3.5,
            content: "Lorem, ipsum dolor sit amet consectetur adipisicing elit. Delectus magni tempore provident? Quaerat, dicta saepe praesentium eaque nobis corrupti aut, quibusdam provident consequatur.",
          },
        ],
      ];
      setTestimonialList(defaultTestimonials);
    }
  }, [testimonials]);

  const handleControl = (type) => {
    if (type === "prev") {
      setIndex(index <= 0 ? testimonialList.length - 1 : index - 1);
    } else if (type === "next") {
      setIndex(index >= testimonialList.length - 1 ? 0 : index + 1);
    }
  };

  if (!testimonialList || testimonialList.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-6 mt-12">
        {testimonialList[index] && testimonialList[index].map((item, i) => (
          <div className="col-span-2 md:col-span-1" key={i}>
            <TestimonialItem item={item} />
          </div>
        ))}
      </div>
      
      <div className="relative flex justify-center items-center my-12">
        <button
          className="text-lg bg-white shadow-xl border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-purple-300 w-12 h-12 flex justify-center items-center rounded-full mr-4 transition-all duration-300 hover:scale-110"
          onClick={() => handleControl("prev")}
          aria-label="Previous testimonials"
        >
          <FontAwesomeIcon icon={faAngleLeft} />
        </button>
        <button
          className="text-lg bg-white shadow-xl border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-purple-300 w-12 h-12 flex justify-center items-center rounded-full transition-all duration-300 hover:scale-110"
          onClick={() => handleControl("next")}
          aria-label="Next testimonials"
        >
          <FontAwesomeIcon icon={faAngleRight} />
        </button>
      </div>
    </>
  );
};

TestimonialsGrid.propTypes = {
  testimonials: PropTypes.array,
};

export default TestimonialsGrid;
