import { User } from '@/types/global';
import React from 'react';

interface DiscordTabProps {
    user: User;
}

const DiscordTab: React.FC<DiscordTabProps> = ({ user }) => {
    const isLinked = !!user.discord_id && !!user.discord_username;

    if (!isLinked) {
        return (
            <div className="flex h-64 items-center justify-center rounded-lg bg-neutral-800 p-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-700">
                        <i className="fab fa-discord text-3xl text-indigo-400"></i>
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">Discord Not Linked</h3>
                    <p className="text-sm text-neutral-400">This user has not linked their Discord account yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-lg bg-indigo-900/20 shadow-lg">
                <div className="bg-indigo-800/20 px-6 py-4">
                    <div className="flex items-center">
                        <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-indigo-800/40">
                            <img
                                src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar || 'default'}.png`}
                                alt="Discord Avatar"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                                }}
                                className="h-full w-full object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{user.discord_username}</h3>
                            <p className="text-sm text-indigo-300">ID: {user.discord_id}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg bg-neutral-800 p-6">
                <h4 className="mb-4 text-sm font-semibold text-white">Discord Integration Benefits</h4>
                <ul className="space-y-2 text-sm">
                    <li className="flex items-center text-neutral-300">
                        <i className="fas fa-check-circle mr-2 text-green-400"></i>
                        Receive notifications via Discord DM
                    </li>
                    <li className="flex items-center text-neutral-300">
                        <i className="fas fa-check-circle mr-2 text-green-400"></i>
                        Access to client-only support channels
                    </li>
                    <li className="flex items-center text-neutral-300">
                        <i className="fas fa-check-circle mr-2 text-green-400"></i>
                        Single sign-on capability
                    </li>
                    <li className="flex items-center text-neutral-300">
                        <i className="fas fa-check-circle mr-2 text-green-400"></i>
                        And more!
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default DiscordTab;
