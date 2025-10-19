<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        // 1. Ajouter le champ 'nom' à la table seances
        if (!Schema::hasColumn('seances', 'nom')) {
            Schema::table('seances', function (Blueprint $table) {
                $table->string('nom')->after('id')->nullable();
            });
        }

        // 2. Mettre à jour le statut des présences (si pas déjà fait)
        DB::statement("ALTER TABLE presences MODIFY statut ENUM('present','absent','retard','demi') DEFAULT 'present'");

        // 3. Optionnel: Renommer uae_id en uea_id si nécessaire
        // if (Schema::hasColumn('seances', 'uae_id')) {
        //     Schema::table('seances', function (Blueprint $table) {
        //         $table->renameColumn('uae_id', 'uea_id');
        //     });
        // }
    }

    public function down()
    {
        // Supprimer le champ nom si on rollback
        if (Schema::hasColumn('seances', 'nom')) {
            Schema::table('seances', function (Blueprint $table) {
                $table->dropColumn('nom');
            });
        }

        // Revenir à l'ancien enum si nécessaire
        DB::statement("ALTER TABLE presences MODIFY statut ENUM('P','A','½') DEFAULT 'P'");
    }
};
