'use client';

import React from 'react';
import { containsKhmer } from '@/utils/khmer-detector';

interface KhmerTextProps extends React.HTMLAttributes<HTMLElement> {
  text: string;
  as?: 'span' | 'p' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const KhmerText: React.FC<KhmerTextProps> = ({ 
  text, 
  as: Component = 'span',
  className = '',
  ...props 
}) => {
  const hasKhmer = containsKhmer(text);
  const finalClassName = `${className} ${hasKhmer ? 'khmer-text' : ''}`.trim();
  
  const elementProps = {
    lang: hasKhmer ? 'km' : undefined,
    className: finalClassName,
    ...props
  };
  
  switch (Component) {
    case 'p':
      return <p {...elementProps}>{text}</p>;
    case 'div':
      return <div {...elementProps}>{text}</div>;
    case 'label':
      return <label {...elementProps}>{text}</label>;
    case 'h1':
      return <h1 {...elementProps}>{text}</h1>;
    case 'h2':
      return <h2 {...elementProps}>{text}</h2>;
    case 'h3':
      return <h3 {...elementProps}>{text}</h3>;
    case 'h4':
      return <h4 {...elementProps}>{text}</h4>;
    case 'h5':
      return <h5 {...elementProps}>{text}</h5>;
    case 'h6':
      return <h6 {...elementProps}>{text}</h6>;
    default:
      return <span {...elementProps}>{text}</span>;
  }
};

// Auto-detect component for mixed content
export const AutoKhmerText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    const detectAndApplyKhmerFont = () => {
      const elements = document.querySelectorAll('label, option, td, th, p, span, div, h1, h2, h3, h4, h5, h6');
      
      elements.forEach((element) => {
        if (element.textContent && containsKhmer(element.textContent)) {
          element.classList.add('khmer-text');
          if (!element.getAttribute('lang')) {
            element.setAttribute('lang', 'km');
          }
        }
      });
    };
    
    detectAndApplyKhmerFont();
    
    // Re-run on DOM changes
    const observer = new MutationObserver(detectAndApplyKhmerFont);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    return () => observer.disconnect();
  }, []);
  
  return <>{children}</>;
};