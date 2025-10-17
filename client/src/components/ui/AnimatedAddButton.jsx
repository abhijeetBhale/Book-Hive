import React from 'react';

const AnimatedAddButton = ({ onClick, children = "Add Friend", ...props }) => {
    return (
        <button
            className="relative w-36 cursor-pointer flex items-center justify-left border border-green-500 bg-green-500 group hover:bg-green-500 active:bg-green-500 active:border-green-500 overflow-hidden"
            style={{ borderRadius: '25px', height: '48px', padding: '0.75rem 1rem' }}
            onClick={onClick}
            {...props}
        >
            <span className="text-gray-200 font-semibold transform group-hover:translate-x-32 transition-all duration-300 z-10 relative">
                {children}
            </span>
            <span className="absolute right-0 h-full w-10 bg-green-500 flex items-center justify-center transform group-hover:translate-x-0 group-hover:w-full transition-all duration-300 z-20" style={{ borderRadius: '25px' }}>
                <svg
                    className="svg w-8 text-white"
                    fill="none"
                    height={24}
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    width={24}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line x1={12} x2={12} y1={5} y2={19} />
                    <line x1={5} x2={19} y1={12} y2={12} />
                </svg>
            </span>
        </button>
    );
};

export default AnimatedAddButton;