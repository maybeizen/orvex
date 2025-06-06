<?php

namespace App\Services;

use Illuminate\Validation\Rules\Password;

class PasswordPolicyService
{
    public static function rules(): Password
    {
        return static::strong();
    }

    public static function strong(): Password
    {
        return Password::min(12)
            ->mixedCase()
            ->letters()
            ->numbers()
            ->symbols()
            ->uncompromised();
    }

    public static function moderate(): Password
    {
        return Password::min(10)
            ->mixedCase()
            ->letters()
            ->numbers();
    }

    public static function basic(): Password
    {
        return Password::min(8)
            ->letters()
            ->numbers();
    }

    public static function evaluateStrength(string $password): array
    {
        $score = 0;
        $feedback = [];

        $length = strlen($password);
        if ($length < 8) {
            $score += 0;
            $feedback[] = 'Password is too short';
        } elseif ($length < 10) {
            $score += 1;
        } elseif ($length < 12) {
            $score += 2;
        } else {
            $score += 3;
        }

        if (preg_match('/[A-Z]/', $password)) {
            $score += 1;
        } else {
            $feedback[] = 'Add uppercase letters';
        }

        if (preg_match('/[a-z]/', $password)) {
            $score += 1;
        } else {
            $feedback[] = 'Add lowercase letters';
        }

        if (preg_match('/[0-9]/', $password)) {
            $score += 1;
        } else {
            $feedback[] = 'Add numbers';
        }

        if (preg_match('/[^A-Za-z0-9]/', $password)) {
            $score += 1;
        } else {
            $feedback[] = 'Add special characters';
        }

        if (preg_match('/(.)\1{2,}/', $password)) {
            $score -= 1;
            $feedback[] = 'Avoid repeated characters';
        }

        if (preg_match('/^(123|abc|qwerty|password|admin|welcome)/i', $password)) {
            $score -= 2;
            $feedback[] = 'Avoid common patterns';
        }

        $score = max(0, min(5, $score));

        return [
            'score' => $score,
            'feedback' => implode(', ', $feedback),
        ];
    }
} 