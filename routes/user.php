<?php

use App\Http\Controllers\User\ProfileController;
use App\Http\Controllers\User\UpdateAvatarController;
use App\Http\Controllers\User\UpdateEmailController;
use App\Http\Controllers\User\UpdatePasswordController;
use App\Http\Controllers\User\UpdateProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->prefix('profile')->group(function () {
    Route::get('/', [ProfileController::class, 'showProfile'])->name('profile.settings');
    Route::post('/update', [UpdateProfileController::class, 'updateProfile'])->name('profile.update');
    Route::post('/email', [UpdateEmailController::class, 'updateEmail'])->name('email.update');
    Route::post('/password', [UpdatePasswordController::class, 'updatePassword'])->name('password.update');
    Route::post('/avatar', [UpdateAvatarController::class, 'updateAvatar'])->name('avatar.update');
    Route::post('/avatar/gravatar', [UpdateAvatarController::class, 'useGravatar'])->name('avatar.setGravatar');

});