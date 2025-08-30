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
        Schema::create('soumissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devoir_id')->constrained('devoirs');
            $table->foreignId('apprenant_id')->constrained('apprenants');
            $table->string('fichier_rendu'); // Chemin du fichier uploadé
            $table->text('commentaire')->nullable(); // Message de l'apprenant
            $table->integer('note')->nullable(); // Sur 20
            $table->text('feedback')->nullable(); // Commentaire du prof
            $table->string('fichier_corrige')->nullable(); // Devoir annoté rendu
            $table->boolean('retard')->default(false);
            $table->timestamps();

             // Contrainte d'unicité : un apprenant ne peut soumettre qu'une fois
            $table->unique(['devoir_id', 'apprenant_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('soumissions');
    }
};
