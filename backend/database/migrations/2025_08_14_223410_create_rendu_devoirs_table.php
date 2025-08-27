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
        Schema::create('rendu_devoirs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devoir_id')->constrained('devoirs');
            $table->foreignId('apprenant_id')->constrained('apprenants');
            $table->string('fichier'); // Chemin du fichier rendu (PDF, ZIP, etc.)
            $table->enum('statut', ['remis', 'en_retard']); // Automatique selon date_limite
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rendu_devoirs');
    }
};
