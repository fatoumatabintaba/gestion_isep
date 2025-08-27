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
        Schema::create('supports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uae_id')->constrained('ueas');
            $table->foreignId('enseignant_id')->constrained('users');
            $table->string('titre');
            $table->text('description')->nullable();
            $table->enum('type', ['cours', 'tp', 'td', 'examen', 'projet']);
            $table->string('fichier'); // chemin vers le fichier
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supports');
    }
};
