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
        Schema::create('seances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uae_id')->constrained('ueas');
            $table->foreignId('enseignant_id')->constrained('users');
            $table->string('salle', 20)->nullable();
            $table->date('date');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->enum('duree', ['4h', '8h']);
            $table->enum('type', ['presentiel', 'en_ligne'])->default('presentiel');
            $table->text('lien_reunion')->nullable();
            $table->enum('statut', ['programmee', 'effectuee', 'annulee'])->default('programmee');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('seances');
    }
};
