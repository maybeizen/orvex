<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    protected $except = [
        'password',
        'password_confirmation',
        '_token',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $this->sanitize($request);
        
        return $next($request);
    }

    protected function sanitize(Request $request): void
    {
        if (!$request->isJson() && !in_array($request->method(), ['GET', 'HEAD'])) {
            $input = $request->all();
            
            array_walk_recursive($input, function (&$value, $key) {
                if (!in_array($key, $this->except) && is_string($value)) {
                    $value = str_replace(chr(0), '', $value);
                    $value = htmlspecialchars($value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                }
            });
            
            $request->merge($input);
        }
    }
} 