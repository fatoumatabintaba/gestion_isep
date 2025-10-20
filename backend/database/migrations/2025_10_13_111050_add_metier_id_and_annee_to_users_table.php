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
          if (!Schema::hasColumn('users', 'metier_id')) {
            $table->foreignId('metier_id')->nullable()->constrained()->onDelete('set null');
        }
        if (!Schema::hasColumn('users', 'annee')) {
            $table->integer('annee')->nullable();
        }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
           if (Schema::hasColumn('users', 'metier_id')) {
            $table->dropForeign(['metier_id']);
            $table->dropColumn('metier_id');
        }
        if (Schema::hasColumn('users', 'annee')) {
            $table->dropColumn('annee');
        }
        });
    }
};
