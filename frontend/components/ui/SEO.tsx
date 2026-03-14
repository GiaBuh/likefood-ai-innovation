import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  path = '',
  image = '/og-image.png',
  type = 'website',
}) => {
  const { t, i18n } = useTranslation();
  const siteTitle = 'LIKEFOOD';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const desc = description || t('footer.description');
  const url = `${baseUrl}${path}`;

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${baseUrl}${image}`} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={i18n.language === 'vi' ? 'vi_VN' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={`${baseUrl}${image}`} />
    </Helmet>
  );
};

export default SEO;
