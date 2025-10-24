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
            $table->text('google_access_token')->nullable();
            $table->text('google_refresh_token')->nullable();
            $table->timestamp('google_token_expires_at')->nullable();
            $table->string('google_id')->nullable()->unique();
            $table->string('google_name')->nullable();
            $table->string('google_email')->nullable();
            $table->string('google_avatar')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
             $table->dropColumn([
                'google_access_token',
                'google_refresh_token',
                'google_token_expires_at',
                'google_id',
                'google_name',
                'google_email',
                'google_avatar',
            ]);
        });
    }
};
