import React from 'react';
import MainLayout from '../layouts/MainLayout';
import RightSidebar from '../RightSidebar';

const DiscoverPage = () => {
    return (
        <MainLayout>
            <div className="max-w-2xl mx-auto lg:max-w-none lg:mr-80">
                <div className="p-4">
                    <h1 className="text-2xl font-bold text-white mb-6">Discover</h1>
                    <RightSidebar isMobile={false} />
                </div>
            </div>
        </MainLayout>
    );
};

export default DiscoverPage;