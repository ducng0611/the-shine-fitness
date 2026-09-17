import React from 'react';
import { BlogSection } from '../components/BlogSection';

export const NewsPage = ({ lang }) => {
  return (
    <div className="pt-20">
      <BlogSection lang={lang} />
    </div>
  );
};
