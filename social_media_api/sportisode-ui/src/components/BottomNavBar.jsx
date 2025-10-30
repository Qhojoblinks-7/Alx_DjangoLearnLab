// src/components/BottomNavBar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, Users } from 'lucide-react';
import { useSelector } from 'react-redux';

// Original Nav Items - moved outside to prevent infinite loop
const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Search, label: 'Explore', href: '/explore' },
    { icon: Users, label: 'Communities', href: '/communities' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: Mail, label: 'Messages', href: '/messages' }
];

// Utility component for a single navigation item
const NavItem = ({ item, isActive, notificationCount }) => {
    const Icon = item.icon;
    const isNotificationTab = item.label === 'Notifications';

    return (
        <Link
            key={item.href}
            to={item.href}
            className="flex-1 min-w-0 flex flex-col items-center justify-center h-full relative z-10"
        >
            <div className="relative p-2">
                {/* Icon */}
                <Icon className={`h-6 w-6 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400'}`} />

                {/* Badge for Notifications tab */}
                {isNotificationTab && notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-dark-bg/95">
                        {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                )}
            </div>
        </Link>
    );
};

const BottomNavBar = () => {
    const location = useLocation();
    const notificationCount = useSelector(state => state.notifications?.unreadCount || 0);


    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-dark-bg/95 backdrop-blur-sm px-2 py-2">
            <div className="relative flex justify-around items-center max-w-md mx-auto h-16 bg-gray-900 rounded-full shadow-2xl shadow-black/50">

                {/* Navigation Items Wrapper */}
                {navItems.map((item) => (
                    <NavItem
                        key={item.href}
                        item={item}
                        isActive={location.pathname === item.href}
                        notificationCount={notificationCount}
                    />
                ))}
            </div>
        </nav>
    );
};

export default BottomNavBar;