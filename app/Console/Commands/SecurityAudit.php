<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SecurityAudit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:audit';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run a security audit on the application';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Running security audit...');
        $this->info('-------------------------');

        $issues = 0;
        
        if (app()->environment('production') && config('app.debug')) {
            $this->error('❌ APP_DEBUG is enabled in production. This can leak sensitive information.');
            $issues++;
        } else {
            $this->info('✅ APP_DEBUG is properly configured');
        }

        if (app()->environment('production') && !config('session.secure')) {
            $this->error('❌ HTTPS is not enforced for cookies. Set SESSION_SECURE_COOKIE=true in production.');
            $issues++;
        } else {
            $this->info('✅ HTTPS enforcement is properly configured');
        }

        if (!config('session.http_only')) {
            $this->error('❌ HTTP-only cookies are not enabled. Set SESSION_HTTP_ONLY=true.');
            $issues++;
        } else {
            $this->info('✅ HTTP-only cookies are enabled');
        }

        if (config('session.same_site') === 'none') {
            $this->error('❌ Same-site cookie policy is set to "none", which is less secure.');
            $issues++;
        } else {
            $this->info('✅ Same-site cookie policy is properly configured');
        }

        if (config('auth.password_timeout') > 10800) {
            $this->error('❌ Password confirmation timeout is too long: ' . config('auth.password_timeout') . ' seconds');
            $issues++;
        } else {
            $this->info('✅ Password confirmation timeout is acceptable');
        }

        if (is_writable(storage_path('logs')) && substr(sprintf('%o', fileperms(storage_path('logs'))), -4) > '0755') {
            $this->error('❌ Log directory has too open permissions: ' . substr(sprintf('%o', fileperms(storage_path('logs'))), -4));
            $issues++;
        } else {
            $this->info('✅ Log directory permissions are acceptable');
        }

        if (File::exists(base_path('.env'))) {
            $envPerms = substr(sprintf('%o', fileperms(base_path('.env'))), -4);
            if ($envPerms > '0644') {
                $this->error('❌ .env file has too open permissions: ' . $envPerms);
                $issues++;
            } else {
                $this->info('✅ .env file permissions are acceptable');
            }
        }

        try {
            if (Schema::hasTable('users') && Schema::hasColumn('users', 'two_factor_enabled')) {
                $totalUsers = DB::table('users')->count();
                $twoFactorUsers = DB::table('users')->where('two_factor_enabled', true)->count();
                $percentage = $totalUsers > 0 ? round(($twoFactorUsers / $totalUsers) * 100, 2) : 0;
                
                $this->info("✅ Two-factor authentication is available");
                $this->line("   - {$twoFactorUsers} out of {$totalUsers} users ({$percentage}%) have enabled 2FA");
                
                if ($percentage < 50) {
                    $this->warn("⚠️ Less than 50% of users have enabled 2FA");
                }
            } else {
                $this->warn("⚠️ Two-factor authentication columns were not found in the users table");
                $issues++;
            }
        } catch (\Exception $e) {
            $this->error('❌ Error checking two-factor authentication: ' . $e->getMessage());
            $issues++;
        }

        $this->info('-------------------------');
        if ($issues > 0) {
            $this->error("Found {$issues} security issues that need attention!");
        } else {
            $this->info('All basic security checks passed!');
        }
        
        $this->info('Note: This is a basic security audit. Consider using professional security tools for a comprehensive assessment.');
        
        return $issues === 0 ? Command::SUCCESS : Command::FAILURE;
    }
} 