/* eslint-disable @next/next/no-img-element -- tip pictures are served straight from the image host; next/image would send them through Vercel's image optimizer */
import { preload } from 'react-dom';
import type { ImgHTMLAttributes } from 'react';
import type { TipImage } from '@/lib/tips';

interface Props {
  /** The tip's picture block from the API; null (older API) renders the plain fallback image. */
  image: TipImage | null;
  /** The image shown when there is no picture block: the tip's featured_image. */
  fallbackSrc: string;
  alt: string;
  /** How wide the picture is shown, for the browser's choice of copy, e.g. "(max-width: 768px) 100vw, 768px". */
  sizes: string;
  /** The page's largest image above the fold: eager, fetched at high priority and preloaded from <head>. */
  priority?: boolean;
  /** Default lazy; ignored when `priority` is set. */
  loading?: 'eager' | 'lazy';
  /** Classes for the <picture> element; unused when there is no picture block. */
  className?: string;
  imgClassName?: string;
}

/**
 * A tip's picture: <picture> offering the API's WebP copies (640 and 1200 wide) with the JPEG as the <img>, which
 * carries the pixel size so the browser reserves the space before the file arrives. Without a picture block it
 * renders the plain <img> the pages always had. Server component: no JavaScript reaches the browser.
 *
 * While rendering a page React preloads every plain non-lazy <img> by itself, but not one inside <picture>, where it
 * cannot know which copy the browser will pick. A non-lazy picture therefore announces its WebP set from here, with
 * the srcset and sizes the browser evaluates, so the chosen copy starts loading before the body is parsed.
 */
export default function TipPicture({ image, fallbackSrc, alt, sizes, priority = false, loading = 'lazy', className, imgClassName }: Props) {
  const attributes: ImgHTMLAttributes<HTMLImageElement> = {
    loading: priority ? 'eager' : loading,
    fetchPriority: priority ? 'high' : undefined,
    decoding: 'async',
    className: imgClassName,
  };

  if (!image) return <img src={fallbackSrc} alt={alt} {...attributes} />;

  const srcSet = image.variants.map((variant) => `${variant.url} ${variant.width}w`).join(', ');
  if (srcSet === '') return <img src={image.url} width={image.width} height={image.height} alt={alt} {...attributes} />;

  if (attributes.loading !== 'lazy') {
    preload(image.url, { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: attributes.fetchPriority });
  }

  return (
    <picture className={className}>
      <source type="image/webp" srcSet={srcSet} sizes={sizes} />
      <img src={image.url} width={image.width} height={image.height} alt={alt} {...attributes} />
    </picture>
  );
}
