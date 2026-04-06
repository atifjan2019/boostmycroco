<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TipComment extends Model
{
    protected $fillable = ['tip_id', 'user_id', 'user_name', 'content', 'status', 'has_url', 'parent_id'];

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

    public function parent()
    {
        return $this->belongsTo(TipComment::class, 'parent_id');
    }

    public function replies()
    {
        return $this->hasMany(TipComment::class, 'parent_id')->orderBy('created_at', 'asc');
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

    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    public static function containsUrl(string $text): bool
    {
        return (bool) preg_match('/https?:\/\/|www\.|\.(com|net|org|io|co)\b/i', $text);
    }
}
