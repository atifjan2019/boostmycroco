#!/bin/bash
# BoostMyCroco - Comment System Backend Setup
# Run this in your SSH terminal at ~/public_html

cd ~/public_html

echo "=== Step 1: Creating Migration ==="
cat > database/migrations/2026_04_06_000001_create_tip_comments_table.php << 'EOF'
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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

    public function down(): void
    {
        Schema::dropIfExists('tip_comments');
    }
};
EOF
echo "Migration created."

echo "=== Step 2: Running Migration ==="
php artisan migrate

echo "=== Step 3: Creating Model ==="
cat > app/Models/TipComment.php << 'EOF'
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipComment extends Model
{
    protected $fillable = ['tip_id', 'user_id', 'user_name', 'content', 'status', 'has_url'];

    protected $casts = [
        'has_url' => 'boolean',
    ];

    public function tip()
    {
        return $this->belongsTo(Tip::class, 'tip_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSpam($query)
    {
        return $query->where('status', 'spam');
    }

    public static function containsUrl(string $text): bool
    {
        return (bool) preg_match('/https?:\/\/|www\.|\.com|\.net|\.org|\.io|\.co/i', $text);
    }
}
EOF
echo "Model created."

echo "=== Step 4: Creating API Controller ==="
cat > app/Http/Controllers/TipCommentController.php << 'CONTROLLER'
<?php

namespace App\Http\Controllers;

use App\Models\TipComment;
use App\Models\Tip;
use Illuminate\Http\Request;

class TipCommentController extends Controller
{
    // GET /api/tips-and-tricks/{slug}/comments — public, only approved
    public function index($slug)
    {
        $tip = Tip::where('slug', $slug)->first();
        if (!$tip) {
            return response()->json([], 200);
        }

        $comments = TipComment::where('tip_id', $tip->id)
            ->approved()
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }

    // POST /api/tips-and-tricks/{slug}/comments — auth required
    public function store(Request $request, $slug)
    {
        $tip = Tip::where('slug', $slug)->first();
        if (!$tip) {
            return response()->json(['error' => 'Tip not found'], 404);
        }

        $request->validate([
            'content' => 'required|string|min:3|max:1000',
        ]);

        $user = $request->user();
        $content = $request->content;
        $hasUrl = TipComment::containsUrl($content);

        // Auto-hold comments with URLs for moderation
        $status = $hasUrl ? 'pending' : 'approved';

        $comment = TipComment::create([
            'tip_id' => $tip->id,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'content' => $content,
            'status' => $status,
            'has_url' => $hasUrl,
        ]);

        return response()->json($comment, 201);
    }
}
CONTROLLER
echo "API Controller created."

echo "=== Step 5: Creating Admin Controller ==="
cat > app/Http/Controllers/AdminCommentController.php << 'ADMINCTRL'
<?php

namespace App\Http\Controllers;

use App\Models\TipComment;
use App\Models\Tip;
use Illuminate\Http\Request;

class AdminCommentController extends Controller
{
    // GET /api/admin/comments — list all comments with filters
    public function index(Request $request)
    {
        $query = TipComment::with('tip:id,title,slug')
            ->orderBy('created_at', 'desc');

        if ($request->has('status') && in_array($request->status, ['approved', 'pending', 'spam'])) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('content', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $comments = $query->paginate(20);
        return response()->json($comments);
    }

    // GET /api/admin/comments/stats
    public function stats()
    {
        return response()->json([
            'total' => TipComment::count(),
            'approved' => TipComment::approved()->count(),
            'pending' => TipComment::pending()->count(),
            'spam' => TipComment::spam()->count(),
        ]);
    }

    // PUT /api/admin/comments/{id} — edit comment
    public function update(Request $request, $id)
    {
        $comment = TipComment::findOrFail($id);

        if ($request->has('content')) {
            $request->validate(['content' => 'string|min:3|max:1000']);
            $comment->content = $request->content;
            $comment->has_url = TipComment::containsUrl($request->content);
        }

        if ($request->has('status') && in_array($request->status, ['approved', 'pending', 'spam'])) {
            $comment->status = $request->status;
        }

        $comment->save();
        return response()->json($comment);
    }

    // DELETE /api/admin/comments/{id}
    public function destroy($id)
    {
        $comment = TipComment::findOrFail($id);
        $comment->delete();
        return response()->json(['message' => 'Comment deleted']);
    }

    // POST /api/admin/comments/{id}/approve
    public function approve($id)
    {
        $comment = TipComment::findOrFail($id);
        $comment->update(['status' => 'approved']);
        return response()->json($comment);
    }

    // POST /api/admin/comments/{id}/spam
    public function spam($id)
    {
        $comment = TipComment::findOrFail($id);
        $comment->update(['status' => 'spam']);
        return response()->json($comment);
    }

    // POST /api/admin/comments/bulk — bulk actions
    public function bulk(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer',
            'action' => 'required|in:approve,spam,delete',
        ]);

        $ids = $request->ids;

        switch ($request->action) {
            case 'approve':
                TipComment::whereIn('id', $ids)->update(['status' => 'approved']);
                break;
            case 'spam':
                TipComment::whereIn('id', $ids)->update(['status' => 'spam']);
                break;
            case 'delete':
                TipComment::whereIn('id', $ids)->delete();
                break;
        }

        return response()->json(['message' => ucfirst($request->action) . ' action completed']);
    }
}
ADMINCTRL
echo "Admin Controller created."

echo "=== Step 6: Adding API Routes ==="
cat >> routes/api.php << 'ROUTES'

// ===== Tip Comments =====
// Public: get approved comments
Route::get('/tips-and-tricks/{slug}/comments', [\App\Http\Controllers\TipCommentController::class, 'index']);
// Auth: post comment
Route::post('/tips-and-tricks/{slug}/comments', [\App\Http\Controllers\TipCommentController::class, 'store'])->middleware('auth:sanctum');

// Admin: comment management
Route::middleware('auth:sanctum')->prefix('admin/comments')->group(function () {
    Route::get('/', [\App\Http\Controllers\AdminCommentController::class, 'index']);
    Route::get('/stats', [\App\Http\Controllers\AdminCommentController::class, 'stats']);
    Route::put('/{id}', [\App\Http\Controllers\AdminCommentController::class, 'update']);
    Route::delete('/{id}', [\App\Http\Controllers\AdminCommentController::class, 'destroy']);
    Route::post('/{id}/approve', [\App\Http\Controllers\AdminCommentController::class, 'approve']);
    Route::post('/{id}/spam', [\App\Http\Controllers\AdminCommentController::class, 'spam']);
    Route::post('/bulk', [\App\Http\Controllers\AdminCommentController::class, 'bulk']);
});
ROUTES
echo "Routes added."

echo "=== Step 7: Clearing cache ==="
php artisan route:clear
php artisan config:clear
php artisan cache:clear

echo ""
echo "✅ Backend setup complete!"
echo "   - tip_comments table created"
echo "   - TipComment model created"
echo "   - Public API: GET/POST /api/tips-and-tricks/{slug}/comments"
echo "   - Admin API: /api/admin/comments/*"
echo ""

# Verify the Tip model exists
echo "=== Checking Tip model ==="
if [ -f "app/Models/Tip.php" ]; then
    echo "✅ Tip model found at app/Models/Tip.php"
elif [ -f "app/Models/TipsAndTrick.php" ]; then
    echo "⚠️  Model is TipsAndTrick, not Tip. Fixing references..."
    sed -i 's/use App\\Models\\Tip;/use App\\Models\\TipsAndTrick as Tip;/g' app/Http/Controllers/TipCommentController.php
    sed -i 's/use App\\Models\\Tip;/use App\\Models\\TipsAndTrick as Tip;/g' app/Http/Controllers/AdminCommentController.php
    echo "✅ Fixed! Using TipsAndTrick as Tip alias."
else
    echo "⚠️  Could not find Tip model. Please check app/Models/ and update controllers."
    ls app/Models/
fi
