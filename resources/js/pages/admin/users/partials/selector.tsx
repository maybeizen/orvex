import { Tab } from '@/types/global';
import React from 'react';

interface TabSelectorProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ tabs, activeTab, setActiveTab }) => {
    const handleTabClick = (tabId: string) => {
        setActiveTab(tabId);
    };

    return (
        <div className="border-b border-neutral-800">
            <div className="flex overflow-x-auto">
                {tabs.map((tab) => (
                    <div key={tab.id} className="group relative">
                        <button
                            className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                                activeTab === tab.id ? 'border-b-2 border-violet-500 text-white' : 'text-neutral-400 hover:text-white'
                            }`}
                            onClick={() => handleTabClick(tab.id)}
                            type="button"
                        >
                            <i className={`${tab.icon} mr-2`}></i>
                            {tab.label}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TabSelector;
