<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tip_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tip_id');
            $table->unsignedBigInteger('user_id');
            $table->string('user_name');
            $table->text('content');
            $table->enum('status', ['approved', 'pending', 'spam'])->default('approved');
            $table->boolean('has_url')->default(false);
            $table->timestamps();
            $table->index('tip_id');
            $table->index('user_id');
            $table->index('status');
        });
    }
    public function down(): void {
        Schema::dropIfExists('tip_comments');
    }
};
