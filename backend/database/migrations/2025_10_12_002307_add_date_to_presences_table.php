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
        Schema::table('presences', function (Blueprint $table) {
            if (!Schema::hasColumn('presences', 'date')) {
            $table->date('date')->default(now()->format('Y-m-d'))->after('apprenant_id');
             }
        // Vérifie aussi que l'index n'existe pas déjà
        if (!Schema::hasIndex('presences', 'presences_seance_id_apprenant_id_date_unique')) {
            $table->unique(['seance_id', 'apprenant_id', 'date']);
        }
        });
        // Et si besoin :
 // 🔒 Un par jour
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presences', function (Blueprint $table) {
           // Supprimer l'index unique AVANT de supprimer la colonne
            $table->dropUnique(['seance_id', 'apprenant_id', 'date']);
            // Puis supprimer la colonne
            $table->dropColumn('date');
        });
    }
};
