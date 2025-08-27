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
        Schema::create('metier_uea', function (Blueprint $table) {
            $table->id();
            $table->foreignId('metier_id')->constrained('metiers')->onDelete('cascade');
            $table->foreignId('uea_id')->constrained('ueas')->onDelete('cascade');
            $table->unique(['metier_id', 'uea_id']); // Évite les doublons
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metier_uea');
    }
};
