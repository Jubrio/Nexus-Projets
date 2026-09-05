<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Membres d'un projet — qui fait partie de l'équipe
        Schema::create('project_members', function (Blueprint $table) {
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['project_id', 'user_id']);
        });

        // Tâches — le cœur du Kanban
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('todo'); // todo, in_progress, done
            $table->string('priority')->default('medium'); // low, medium, high
            $table->unsignedInteger('position')->default(0); // ordre dans la colonne Kanban
            $table->date('due_date')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
        });

        // Commentaires sur une tâche
        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('task_id')->constrained('tasks')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->text('content');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('project_members');
    }
};
