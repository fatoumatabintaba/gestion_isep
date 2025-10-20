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
        Schema::table('seances', function (Blueprint $table) {

        $table->string('uea_nom')->nullable();
        $table->unsignedBigInteger('metier_id')->nullable();
        $table->unsignedInteger('annee')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('seances', function (Blueprint $table) {
               $table->dropColumn(['uea_nom', 'metier_id', 'annee']);
        });
    }
};
