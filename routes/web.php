<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\DiscordController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('welcome');

Route::middleware(['auth', 'verified', '2fa'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    
    // Discord OAuth routes
    Route::get('auth/discord/connect', [DiscordController::class, 'connect'])->name('discord.connect');
    Route::get('auth/discord/callback', [DiscordController::class, 'callback'])->name('discord.callback');
    Route::post('auth/discord/disconnect', [DiscordController::class, 'disconnect'])->name('discord.disconnect');
});

require __DIR__.'/auth.php';
require __DIR__.'/user.php';
require __DIR__.'/admin.php';
