<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // 1. Ajouter la colonne correcte `uea_id` (sans contrainte encore)
        Schema::table('seances', function (Blueprint $table) {
            $table->unsignedBigInteger('uea_id')->nullable()->after('id');
        });

        // 2. Copier les données de `uae_id` vers `uea_id`
        DB::statement('UPDATE seances SET uea_id = uae_id WHERE uae_id IS NOT NULL');

        // 3. Supprimer l'ancienne colonne `uae_id`
        Schema::table('seances', function (Blueprint $table) {
            $table->dropForeign(['uae_id']);
            $table->dropColumn('uae_id');
        });

        // 4. Recréer la clé étrangère sur `uea_id`
        Schema::table('seances', function (Blueprint $table) {
            $table->foreign('uea_id')->references('id')->on('ueas')->onDelete('cascade');
        });
    }

    public function down()
    {
        // 1. Ajouter temporairement `uae_id`
        Schema::table('seances', function (Blueprint $table) {
            $table->unsignedBigInteger('uae_id')->nullable();
        });

        // 2. Copier les données en sens inverse
        DB::statement('UPDATE seances SET uae_id = uea_id WHERE uea_id IS NOT NULL');

        // 3. Supprimer `uea_id` et sa contrainte
        Schema::table('seances', function (Blueprint $table) {
            $table->dropForeign(['uea_id']);
            $table->dropColumn('uea_id');
        });

        // 4. Recréer la FK sur `uae_id`
        Schema::table('seances', function (Blueprint $table) {
            $table->foreign('uae_id')->references('id')->on('ueas')->onDelete('cascade');
        });
    }
};
