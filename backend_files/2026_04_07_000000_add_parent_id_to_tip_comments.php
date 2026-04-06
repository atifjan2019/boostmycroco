<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tip_comments', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('has_url');
            $table->index('parent_id');
        });
    }
    public function down(): void {
        Schema::table('tip_comments', function (Blueprint $table) {
            $table->dropIndex(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};
