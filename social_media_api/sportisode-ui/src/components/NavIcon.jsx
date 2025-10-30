// src/components/NavIcon.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../components/components/ui/tooltip";

const NavIcon = ({ icon: Icon, label, href, count = 0, isTweetButton = false, onClick }) => {
    // Styling for the badge (like the '3' on the notification bell)
    const badge = count > 0 ? (
        <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-sport-accent border-2 border-dark-bg flex items-center justify-center text-[10px] font-bold text-white">
            {count}
        </span>
    ) : null;

    // Styling for the main icon container
    const iconContent = (
        <div className={`p-3 relative rounded-full flex items-center justify-center 
                        ${isTweetButton 
                            ? 'bg-sport-accent h-14 w-14 shadow-lg hover:bg-sport-accent/90 transition-all'
                            : 'hover:bg-gray-800/50 transition-colors'
                        }`}
        >
            <Icon className={`h-7 w-7 ${isTweetButton ? 'text-white' : 'text-gray-100'}`} />
            {badge}
        </div>
    );
    
    // The Sidebar is highly dependent on Tooltips for accessibility
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {isTweetButton ? (
                        <button onClick={onClick} className="focus:outline-none">
                            {iconContent}
                        </button>
                    ) : onClick ? (
                        <button onClick={onClick} className="focus:outline-none w-full text-left">
                            <Link to={href} className="block">
                                {iconContent}
                            </Link>
                        </button>
                    ) : (
                        <Link to={href} className="focus:outline-none">
                            {iconContent}
                        </Link>
                    )}
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-white text-dark-bg font-semibold ml-2">
                    <p>{label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

export default NavIcon;