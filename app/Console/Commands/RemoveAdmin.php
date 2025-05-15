<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class RemoveAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:remove-admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Removes admin role from a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('This command will remove admin from a user.');
        $email = $this->ask('Please enter the email of the user you want to remove fropm admin');

        $user = \App\Models\User::where('email', $email)->first();

        if ($user) {

            if ($user->role != 'admin') {
                $this->error('User is not an admin');
                return;
            }
            
            $user->role = 'user';
            $user->save();
            $this->info('User has been removed from admin successfully.');
        } else {
            $this->error('User not found.');
        }
    }
}
