<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modifier le type enum via SQL brut
        DB::statement("ALTER TABLE presences MODIFY statut ENUM('present','absent','retard','demi') DEFAULT 'present'");
        // Ne rien ajouter si les colonnes existent déjà
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Pour revenir à l'ancien enum
        DB::statement("ALTER TABLE presences MODIFY statut ENUM('P','A','½') DEFAULT 'P'");
    }
};
