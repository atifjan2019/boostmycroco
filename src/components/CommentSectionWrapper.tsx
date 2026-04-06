'use client';

import dynamic from 'next/dynamic';

const CommentSection = dynamic(() => import('@/components/CommentSection'), { ssr: false });

export default function CommentSectionWrapper({ tipId, tipSlug }: { tipId: number; tipSlug: string }) {
  return <CommentSection tipId={tipId} tipSlug={tipSlug} />;
}
