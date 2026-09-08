import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { seoConfig } from '@/lib/seoConfig';

type SEOProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noIndex?: boolean;
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
};

const toAbsoluteUrl = (value?: string) => {
  if (!value) return seoConfig.defaultImage;
  if (/^https?:\/\//i.test(value)) return value;
  return `${seoConfig.siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
};

const setMeta = (selector: string, attribute: 'content' | 'href', value: string) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;

  if (!element) {
    if (selector.startsWith('meta')) {
      element = document.createElement('meta');
      const nameMatch = selector.match(/\[name="([^"]+)"\]/);
      const propertyMatch = selector.match(/\[property="([^"]+)"\]/);
      if (nameMatch) element.setAttribute('name', nameMatch[1]);
      if (propertyMatch) element.setAttribute('property', propertyMatch[1]);
    } else {
      element = document.createElement('link');
      const relMatch = selector.match(/\[rel="([^"]+)"\]/);
      if (relMatch) element.setAttribute('rel', relMatch[1]);
    }
    document.head.appendChild(element);
  }

  element.setAttribute(attribute, value);
};

export function SEO({
  title = `${seoConfig.siteName} | Naikfoods`,
  description = seoConfig.defaultDescription,
  keywords = [],
  path,
  image,
  type = 'website',
  noIndex = false,
  schema,
}: SEOProps) {
  const location = useLocation();

  useEffect(() => {
    const canonicalPath = path ?? `${location.pathname}${location.search}`;
    const canonicalUrl = `${seoConfig.siteUrl}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;
    const absoluteImage = toAbsoluteUrl(image);
    const trimmedTitle = title.trim();
    const pageTitle = trimmedTitle.toLowerCase().endsWith(seoConfig.siteName.toLowerCase())
      ? trimmedTitle
      : `${trimmedTitle} | ${seoConfig.siteName}`;
    const robots = noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large';
    const allKeywords = [
      seoConfig.siteName,
      ' Naikfoods',
      '  ethnic wear',
      'boutique fashion India',
      'designer dresses',
      'anarkali dresses',
      'lehenga sets',
      'Hyderabad boutique',
      ...keywords,
    ];
    const schemaItems = Array.isArray(schema) ? schema : schema ? [schema] : [];

    document.title = pageTitle;
    setMeta('meta[name="title"]', 'content', pageTitle);
    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content', [...new Set(allKeywords)].join(', '));
    setMeta('meta[name="author"]', 'content', seoConfig.siteName);
    setMeta('meta[name="robots"]', 'content', robots);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);

    setMeta('meta[property="og:type"]', 'content', type === 'product' ? 'product' : type);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', pageTitle);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', absoluteImage);
    setMeta('meta[property="og:site_name"]', 'content', seoConfig.siteName);
    setMeta('meta[property="og:locale"]', 'content', 'en_IN');

    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:url"]', 'content', canonicalUrl);
    setMeta('meta[name="twitter:title"]', 'content', pageTitle);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', absoluteImage);

    document.querySelectorAll('script[data-seo-schema="true"]').forEach((node) => node.remove());
    schemaItems.forEach((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seoSchema = 'true';
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
    });
  }, [description, image, keywords, location.pathname, location.search, noIndex, path, schema, title, type]);

  return null;
}
