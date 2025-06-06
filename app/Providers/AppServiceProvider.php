<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Route;
use Illuminate\Cookie\Middleware\EncryptCookies;
use App\Http\Middleware\SanitizeInput;
use App\Http\Middleware\ThrottleLogins;

class AppServiceProvider extends ServiceProvider
{

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }
        Schema::defaultStringLength(191);
        
        $this->registerSecurityMiddleware();

        $this->registerValidationRules();
    }

    protected function registerSecurityMiddleware(): void
    {
        $this->app['router']->aliasMiddleware('sanitize', SanitizeInput::class);
        $this->app['router']->aliasMiddleware('throttle.logins', ThrottleLogins::class);
        
        $this->app['router']->pushMiddlewareToGroup('web', SanitizeInput::class);

        $encryptCookies = $this->app->make(EncryptCookies::class);
        $encryptCookies->disableFor([]);
    }
    
    protected function registerValidationRules(): void
    {
        Validator::extend('no_sql_injection', function ($attribute, $value, $parameters, $validator) {
            $patterns = [
                '/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|UNION)\b/i',
                '/\b(FROM|WHERE|GROUP BY|ORDER BY|HAVING)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b/i',
                '/--/',
                '/;.*;/',
                '/\/\*.*\*\//',
            ];
            
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $value)) {
                    return false;
                }
            }
            
            return true;
        }, 'The :attribute may not contain SQL injection attempts.');
    }
}
