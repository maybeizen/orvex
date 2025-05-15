<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Adds admin role to a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('This command will make a user an admin.');
        $email = $this->ask('Please enter the email of the user you want to make an admin');

        $user = \App\Models\User::where('email', $email)->first();

        if ($user) {

            if ($user->role == 'admin') {
                $this->error('User is already an admin.');
                return;
            }
            
            $user->role = 'admin';
            $user->save();
            $this->info('User has been made an admin successfully.');
        } else {
            $this->error('User not found.');
        }
    }
}
