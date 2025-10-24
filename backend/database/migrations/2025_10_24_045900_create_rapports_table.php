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
        Schema::create('rapports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Relation avec l'utilisateur
            $table->string('metier');
            $table->string('code_metier');
            $table->json('statistiques');
            $table->string('periode');
            $table->integer('justificatifs_traites')->default(0);
            $table->enum('statut', ['brouillon', 'en_attente', 'valide', 'rejete'])->default('brouillon');
            $table->timestamp('date_soumission')->nullable();
            $table->timestamp('date_validation')->nullable();
            $table->timestamp('date_rejet')->nullable();
            $table->boolean('envoye_administration')->default(false);
            $table->timestamp('date_envoi_administration')->nullable();
            $table->timestamps();

            // Index pour améliorer les performances
            $table->index('user_id');
            $table->index('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rapports');
    }
};
