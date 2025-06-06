<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    protected $headers = [
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'SAMEORIGIN',
        'X-XSS-Protection' => '1; mode=block',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Permissions-Policy' => 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
        'Cross-Origin-Embedder-Policy' => null,
        'Cross-Origin-Opener-Policy' => null,   
        'Cross-Origin-Resource-Policy' => null,
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (app()->environment('production')) {
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'"
            );
        }

        foreach ($this->headers as $key => $value) {
            if (!is_null($value)) {
                $response->headers->set($key, $value);
            }
        }

        return $response;
    }
} 