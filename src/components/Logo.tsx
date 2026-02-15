
import React from 'react';

export const Logo = ({ className }: { className?: string }) => {
    return (
        <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M20 70 L45 45 L60 60 L85 25"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M75 25 L85 25 L85 35"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
