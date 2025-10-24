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
        Schema::create('absence_notifications', function (Blueprint $table) {
            $table->id();
        $table->foreignId('apprenant_id')->constrained()->onDelete('cascade');
        $table->foreignId('seance_id')->constrained()->onDelete('cascade');
        $table->enum('statut', ['en_attente', 'justifie', 'non_justifie'])->default('en_attente');
        $table->text('justificatif_url')->nullable();
        $table->text('motif_justificatif')->nullable();
        $table->timestamp('notified_at');
        $table->timestamp('justified_at')->nullable();
        $table->timestamps();

        $table->index(['apprenant_id', 'statut']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absence_notifications');
    }
};
