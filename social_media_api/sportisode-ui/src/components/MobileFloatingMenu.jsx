import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Feather, Search, Bookmark, Video } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveModal } from '@/store/liveStreamSlice';

// Define the buttons that will appear in the semi-circle menu
const menuItems = [
    {
        name: 'Create Post',
        icon: Feather,
        action: 'post',
        color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
        name: 'Saved',
        icon: Bookmark,
        path: '/saved',
        color: 'bg-green-600 hover:bg-green-700'
    },
    {
        name: 'Search',
        icon: Search,
        path: '/search',
        color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
        name: 'Discover',
        icon: () => <span className="text-lg font-bold">+</span>,
        action: 'discover',
        color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
        name: 'Go Live',
        icon: Video,
        action: 'live',
        color: 'bg-red-600 hover:bg-red-700'
    },
];

const MobileFloatingMenu = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch();
    const menuRef = useRef(null);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleMenuItemClick = (item) => {
        if (item.action === 'post') {
            console.log('Create Post clicked');
            setIsOpen(false);
        } else if (item.action === 'live') {
            dispatch(setActiveModal('create'));
            setIsOpen(false);
        } else if (item.action === 'discover') {
            setIsOpen(false);
            window.location.href = '/discover';
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={menuRef} className="fixed bottom-[100px] right-10 z-50 md:hidden">

            <div className="relative">
                {menuItems.map((item, index) => {
                    const totalItems = menuItems.length;
                    const angleRange = Math.PI * 0.8; 
                    const startAngle = -Math.PI * 0.35; 
                    const angleStep = totalItems > 1 ? angleRange / (totalItems - 1) : 0; // Prevent division by zero
                    const angle = startAngle - (index * angleStep); 

                    const radius = 68; 
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    const commonClasses = 'w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 absolute right-0';

                    const openStyle = {
                        transform: `translate(${x}px, ${y}px)`,
                        opacity: 1,
                        transitionDelay: `${(menuItems.length - 1 - index) * 50}ms`,
                        // Ensure buttons are clickable when open
                        pointerEvents: 'auto', 
                    };

                    const closedStyle = {
                        transform: 'translate(0, 0)',
                        opacity: 0,
                        // Block clicks when closed
                        pointerEvents: 'none', 
                        transitionDelay: `${index * 50}ms`,
                    };

                    if (item.path) {
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsOpen(false)} // Close menu on navigation
                                style={isOpen ? openStyle : closedStyle}
                                className={`${commonClasses} ${item.color}`}
                                aria-label={item.name}
                            >
                                {typeof item.icon === 'function' ? (
                                    <item.icon />
                                ) : (
                                    <item.icon className="w-5 h-5 text-white" />
                                )}
                            </Link>
                        );
                    } else {
                        return (
                            <button
                                key={item.name}
                                onClick={() => handleMenuItemClick(item)} // No stopPropagation needed
                                style={isOpen ? openStyle : closedStyle}
                                className={`${commonClasses} ${item.color}`}
                                aria-label={item.name}
                            >
                                {typeof item.icon === 'function' ? (
                                    <item.icon />
                                ) : (
                                    <item.icon className="w-6 h-6 text-white" />
                                )}
                            </button>
                        );
                    }
                })}

                {/* Main FAB Button (Always visible) */}
                <button
                    onClick={toggleMenu}
                    className={`
                        w-14 h-14 rounded-full flex items-center justify-center
                        bg-sport-accent hover:bg-sport-accent/90 text-black
                        shadow-xl transition-transform duration-300 z-50
                        ${isOpen ? 'rotate-45' : ''}
                    `}
                    aria-expanded={isOpen}
                    aria-label="Toggle floating menu"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default MobileFloatingMenu;