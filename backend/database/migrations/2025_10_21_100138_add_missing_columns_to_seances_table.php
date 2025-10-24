<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('seances', function (Blueprint $table) {
            // ✅ Ajouter les colonnes manquantes
            if (!Schema::hasColumn('seances', 'uea_nom')) {
                $table->string('uea_nom')->nullable()->after('uea_id');
            }

            if (!Schema::hasColumn('seances', 'metier_id')) {
                $table->foreignId('metier_id')->nullable()->constrained('metiers')->after('uea_nom');
            }

            if (!Schema::hasColumn('seances', 'annee')) {
                $table->string('annee')->nullable()->after('metier_id');
            }

            // ✅ CORRECTION CRITIQUE : Rendre uea_id NULLABLE
            // Car vous utilisez maintenant uea_nom à la place
            $table->unsignedBigInteger('uea_id')->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('seances', function (Blueprint $table) {
            $table->dropColumn(['uea_nom', 'metier_id', 'annee']);
        });
    }
};
