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
             // Ajouter un lien vers une séance (optionnel)
            $table->foreignId('seance_id')->nullable()->constrained('seances')->after('uae_id');

            // Fichier de consigne (ex: PDF, Word)
            $table->string('fichier_consigne')->nullable()->after('description');

            // Coefficient (pondération)
            $table->integer('coefficient')->default(1)->after('date_limite');

            // Pour gérer directement dans devoirs (optionnel, mais utile pour stats)
            $table->boolean('ouverte')->default(true); // Ou fermée après date limite

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devoirs', function (Blueprint $table) {
           $table->dropColumn(['seance_id', 'fichier_consigne', 'coefficient', 'ouverte']);
        });
    }
};
