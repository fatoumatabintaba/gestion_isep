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
            // Ajoute les colonnes
            $table->unsignedBigInteger('metier_id')->after('apprenant_id')->nullable();
            $table->integer('annee')->after('metier_id')->nullable();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('presences', function (Blueprint $table) {
           $table->dropColumn(['metier_id', 'annee']);
        });
    }
};
