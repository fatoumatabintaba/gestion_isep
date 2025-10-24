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
        Schema::table('ueas', function (Blueprint $table) {
             $table->foreignId('metier_id')
                  ->nullable()
                  ->constrained('metiers') // suppose que la table metiers existe
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ueas', function (Blueprint $table) {
           $table->dropForeign(['metier_id']);
            $table->dropColumn('metier_id');
        });
    }
};
