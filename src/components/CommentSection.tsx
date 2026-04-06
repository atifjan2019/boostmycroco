'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTurnstile } from '@/hooks/useTurnstile';
import TurnstileWidget from '@/components/TurnstileWidget';
import Link from 'next/link';

interface Comment {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
  status: string;
}

export default function CommentSection({ tipId, tipSlug }: { tipId: number; tipSlug: string }) {
  const { user, token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const turnstile = useTurnstile();

  useEffect(() => {
    fetchComments();
  }, [tipSlug]);

  async function fetchComments() {
    try {
      const res = await fetch(`/api/tips-and-tricks/${tipSlug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      console.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmed = content.trim();
    if (!trimmed || trimmed.length < 3) {
      setError('Comment must be at least 3 characters.');
      return;
    }
    if (trimmed.length > 1000) {
      setError('Comment must be under 1000 characters.');
      return;
    }

    if (turnstile.isEnabled && !turnstile.token) {
      turnstile.setError('Please complete the verification.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tips-and-tricks/${tipSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tip_id: tipId,
          content: trimmed,
          turnstile_token: turnstile.token,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || 'Failed to post comment.');
      }

      const data = await res.json();

      setContent('');
      turnstile.rerender();

      // If the comment contains a URL, it goes to pending
      if (data.status === 'pending') {
        setSuccessMsg('Your comment has been submitted and is awaiting moderation.');
      } else {
        setSuccessMsg('Comment posted successfully!');
      }
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchComments();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
      turnstile.reset();
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="mt-16 pt-10 border-t border-slate-200">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-slate-900">
          Comments
          <span className="ml-2 text-sm font-medium text-slate-400">
            ({comments.length})
          </span>
        </h2>
      </div>

      {/* Comment Form */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-8">
        {!user ? (
          <div className="text-center py-4">
            <p className="text-slate-600 font-medium mb-3">Join the conversation</p>
            <div className="flex justify-center gap-3">
              <Link href="/login" className="btn btn-outline text-sm py-2 px-5">Log In</Link>
              <Link href="/register" className="btn btn-primary text-sm py-2 px-5">Register</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-slate-700">{user.name}</span>
            </div>

            {error && (
              <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-3 p-3 bg-green-50 text-green-700 rounded-lg border border-green-100 text-sm font-medium">
                {successMsg}
              </div>
            )}

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-slate-400 font-medium resize-none bg-white text-sm"
            />
            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              <span className="text-xs text-slate-400">{content.length}/1000</span>
              <div className="flex items-center gap-3 flex-wrap">
                <TurnstileWidget containerRef={turnstile.containerRef} error={turnstile.error} isEnabled={turnstile.isEnabled} />
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="btn btn-primary text-sm py-2 px-5 flex items-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></span>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin w-8 h-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-300">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-emerald-100 flex items-center justify-center text-primary text-xs font-bold">
                    {comment.user_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="font-semibold text-slate-800 text-sm">{comment.user_name}</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">{timeAgo(comment.created_at)}</span>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
