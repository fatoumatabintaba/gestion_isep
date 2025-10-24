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
        Schema::table('devoirs', function (Blueprint $table) {
             $table->foreignId('metier_id')->nullable()->constrained('metiers');
            $table->string('annee')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devoirs', function (Blueprint $table) {
            $table->dropColumn('metier_id');
            $table->dropColumn('annee');
        });
    }
};
