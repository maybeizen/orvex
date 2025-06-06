<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\App;

class SecurityServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if (App::environment('production')) {
            URL::forceScheme('https');
        }

        $this->app['router']->pushMiddlewareToGroup('web', \App\Http\Middleware\SecurityHeaders::class);
    }
} 