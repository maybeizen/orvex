import { Button } from '@/components/button';
import { User } from '@/types/global';
import React from 'react';

interface ServicesTabProps {
    user: User;
}

const ServicesTab: React.FC<ServicesTabProps> = ({ user }) => {
    return (
        <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
                <i className="fas fa-server text-2xl text-neutral-400"></i>
            </div>
            <h3 className="mb-2 text-lg font-bold text-white">No Active Services</h3>
            <p className="mb-6 text-neutral-400">This user doesn't have any active services yet</p>
            <Button variant="primary" type="button">
                <i className="fas fa-plus-circle mr-2"></i>
                Add New Service
            </Button>
        </div>
    );
};

export default ServicesTab;
