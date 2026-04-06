<?php
namespace App\Http\Controllers;

use App\Models\TipComment;
use App\Models\Tip;
use Illuminate\Http\Request;

class TipCommentController extends Controller
{
    public function index($slug)
    {
        $tip = Tip::where('slug', $slug)->first();
        if (!$tip) {
            return response()->json([], 200);
        }

        $comments = TipComment::where('tip_id', $tip->id)
            ->approved()
            ->topLevel()
            ->with(['replies' => function ($query) {
                $query->approved()->with('replies');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, $slug)
    {
        $tip = Tip::where('slug', $slug)->first();
        if (!$tip) {
            return response()->json(['error' => 'Tip not found'], 404);
        }

        $request->validate([
            'content' => 'required|string|min:3|max:1000',
            'parent_id' => 'nullable|integer|exists:tip_comments,id',
        ]);

        $user = $request->user();
        $content = $request->content;
        $hasUrl = TipComment::containsUrl($content);
        $status = $hasUrl ? 'pending' : 'approved';

        $comment = TipComment::create([
            'tip_id' => $tip->id,
            'user_id' => $user->id,
            'user_name' => $user->name,
            'content' => $content,
            'status' => $status,
            'has_url' => $hasUrl,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json($comment, 201);
    }
}
