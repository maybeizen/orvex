<?php

use App\Http\Controllers\Admin\Users\ActionController;
use App\Http\Controllers\Admin\Users\ViewUsersController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified', '2fa', 'admin'])->prefix('admin')->group(function () {
    Route::get('/', function () {
        return Inertia::render('admin/dashboard');
    })->name('admin.dashboard');

    Route::get('/users', [ViewUsersController::class, 'index'])->name('admin.users.index');
    Route::get('/users/{id}/edit', [ActionController::class, 'edit'])->name('admin.users.edit');
    Route::put('/users/{id}', [ActionController::class, 'update'])->name('admin.users.update');
    Route::delete('/users/{id}', [ActionController::class, 'delete'])->name('admin.users.delete');
});
