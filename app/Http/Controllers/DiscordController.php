<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DiscordController extends Controller
{
    public function connect()
    {
        $clientId = config('services.discord.client_id');
        $redirectUri = config('services.discord.redirect_uri');
        
        $url = "https://discord.com/api/oauth2/authorize";
        $params = [
            'client_id' => $clientId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'identify email',
        ];
        
        return redirect($url . '?' . http_build_query($params));
    }

    public function callback(Request $request)
    {
        try {
            $code = $request->input('code');
            if (!$code) {
                return redirect()->route('dashboard')->with('error', 'Discord authorization was denied');
            }
            
            $clientId = config('services.discord.client_id');
            $clientSecret = config('services.discord.client_secret');
            $redirectUri = config('services.discord.redirect_uri');

            $response = Http::asForm()->post('https://discord.com/api/oauth2/token', [
                'client_id' => $clientId,
                'client_secret' => $clientSecret,
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $redirectUri,
            ]);

            if (!$response->successful()) {
                Log::error('Discord token exchange failed', [
                    'response' => $response->body(),
                    'status' => $response->status()
                ]);
                return redirect()->route('dashboard')->with('error', 'Failed to connect to Discord');
            }

            $tokens = $response->json();

            if (!isset($tokens['access_token'])) {
                Log::error('Discord token missing in response', ['tokens' => $tokens]);
                return redirect()->route('dashboard')->with('error', 'Failed to connect to Discord');
            }

            $userResponse = Http::withHeaders([
                'Authorization' => "Bearer {$tokens['access_token']}",
            ])->get('https://discord.com/api/users/@me');

            if (!$userResponse->successful()) {
                Log::error('Discord user info fetch failed', [
                    'response' => $userResponse->body(),
                    'status' => $userResponse->status()
                ]);
                return redirect()->route('dashboard')->with('error', 'Failed to fetch Discord user info');
            }

            $discordUser = $userResponse->json();
            $user = Auth::user();

            $user->discord_id = $discordUser['id'];
            $user->discord_username = $discordUser['username']; 
            $user->discord_access_token = $tokens['access_token'];
            $user->discord_refresh_token = $tokens['refresh_token'] ?? null;
            $user->save();

            return redirect()->route('dashboard')->with('success', 'Discord connected successfully');
        } catch (\Exception $e) {
            Log::error('Discord connection error', ['error' => $e->getMessage()]);
            return redirect()->route('dashboard')->with('error', 'An error occurred connecting to Discord');
        }
    }
    
    public function disconnect()
    {
        $user = Auth::user();
        
        $user->discord_id = null;
        $user->discord_username = null;
        $user->discord_access_token = null;
        $user->discord_refresh_token = null;
        $user->save();
        
        return redirect()->route('dashboard')->with('success', 'Discord disconnected successfully');
    }
}
