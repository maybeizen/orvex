<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('discord_id')->nullable()->after('remember_token');
            $table->string('discord_username')->nullable()->after('discord_id');
            $table->string('discord_access_token')->nullable()->after('discord_username');
            $table->string('discord_refresh_token')->nullable()->after('discord_access_token');
            $table->string('discord_avatar')->nullable()->after('discord_refresh_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('discord_id');
            $table->dropColumn('discord_username');
            $table->dropColumn('discord_access_token');
            $table->dropColumn('discord_refresh_token');
            $table->dropColumn('discord_avatar');
        });
    }
};
