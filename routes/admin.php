<?php

use App\Http\Controllers\Admin\Users\BalanceController;
use App\Http\Controllers\Admin\Users\DeleteUserController;
use App\Http\Controllers\Admin\Users\UpdateProfileController;
use App\Http\Controllers\Admin\Users\VerifyEmailController;
use App\Http\Controllers\Admin\Users\ViewUserController;
use App\Http\Controllers\Admin\Users\ViewUsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', '2fa', 'admin'])->prefix('admin')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin/dashboard');
    })->name('admin.dashboard');

    // User management routes
    Route::get('/users', [ViewUsersController::class, 'index'])->name('admin.users.index');
    
    // Single user routes
    Route::get('/users/{id}/edit', ViewUserController::class)->name('admin.users.edit');
    Route::put('/users/{id}/profile', UpdateProfileController::class)->name('admin.users.update.profile');
    Route::delete('/users/{id}', DeleteUserController::class)->name('admin.users.delete');
    
    // Email verification routes
    Route::put('/users/{id}/verify-email', [VerifyEmailController::class, 'verify'])->name('admin.users.verify-email');
    Route::put('/users/{id}/unverify-email', [VerifyEmailController::class, 'unverify'])->name('admin.users.unverify-email');
    
    // Balance management routes
    Route::post('/users/{id}/adjust-balance', [BalanceController::class, 'adjustBalance'])->name('admin.users.adjust-balance');
});
