
import React, { useEffect } from 'react';
import { View, Job } from '../types';

interface SEOManagerProps {
  activeView: View;
  activeJob?: Job;
  activeRegion?: string;
}

const SEOManager: React.FC<SEOManagerProps> = ({ activeView, activeJob, activeRegion }) => {
  useEffect(() => {
    let title = 'ALPHA CONSORTIUM | Ethical Industrial Talent Alliance';
    let description = 'The premier industrial talent bridge connecting skilled professionals from South Asia with Balkan manufacturing hubs. AI-powered recruitment and relocation ecosystem.';
    let keywords = 'Alpha Consortium, Industrial Jobs Balkans, Romania Recruitment, Nepal Talent, Bangladesh Skilled Workers, Ethical Hiring, International Relocation AI';
    let structuredData: any = null;

    switch (activeView) {
      case View.Hero:
        title = 'ALPHA CONSORTIUM | The Ethical Talent Alliance';
        description = 'Connecting industrial excellence in South Asia directly with Balkan manufacturing and tech hubs. Data-driven career scaling for skilled talent.';
        break;
      case View.Jobs:
        title = 'Find International Jobs in Balkans | Alpha Nexus';
        description = 'Search verified jobs in Romania, Croatia, and Bulgaria for skilled professionals. AI-driven neural matchmaking with no middleman fees.';
        break;
      case View.VisaTrack:
        title = activeRegion 
          ? `Work Visa & Relocation Guide for ${activeRegion} | Balkan Bridge`
          : 'Balkan Bridge: International Relocation AI | Alpha Consortium';
        description = `Step-by-step AI-powered guide for moving to ${activeRegion || 'the Balkan region'}. Documents, cultural tips, and embassy interview prep.`;
        break;
      case View.Academy:
        title = 'Alpha Academy | Industrial Certifications for South Asian Talent';
        description = 'Elevate your technical skills with expert-led courses designed for the European industrial landscape.';
        break;
      case View.PostJob:
        title = 'Post an Industrial Job | Employer Nexus Hub';
        description = 'Recruit verified skilled talent from South Asia. Use AI to optimize your listings for maximum regional visibility.';
        break;
      case View.MarketTrends:
        title = 'Real-time Industrial Hiring Trends | Consortium Pulse';
        description = 'AI-driven insights into Balkan employment trends, salary data, and emerging technical skill demands.';
        break;
      case View.OfferSense:
        title = 'OfferSense - AI Contract Analyzer | Career Protection';
        description = 'Analyze your job offer for competitiveness and red flags. Get an AI-generated negotiation strategy for Balkan roles.';
        break;
    }

    // Individual Job SEO (if a job is selected/focused)
    if (activeJob) {
      title = `${activeJob.title} at ${activeJob.company} | Jobs in ${activeJob.location}`;
      description = `Join ${activeJob.company} as a ${activeJob.title} in ${activeJob.location}. Verified opportunity by Alpha Consortium.`;
      
      // Google Job Posting Structured Data (JSON-LD)
      structuredData = {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": activeJob.title,
        "description": activeJob.description,
        "datePosted": activeJob.postedDate || new Date().toISOString().split('T')[0],
        "hiringOrganization": {
          "@type": "Organization",
          "name": activeJob.company,
          "sameAs": activeJob.hiringOrganization?.sameAs || "https://alphaconsortium.ai"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": activeJob.location.split(',')[0].trim(),
            "addressRegion": activeJob.location.split(',')[1]?.trim() || "",
            "streetAddress": "Regional Office"
          }
        },
        "baseSalary": activeJob.salaryMin ? {
          "@type": "MonetaryAmount",
          "currency": "EUR",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": activeJob.salaryMin,
            "maxValue": activeJob.salaryMax,
            "unitText": "MONTH"
          }
        } : undefined
      };
    }

    // Update Meta Tags
    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);
    else {
        const meta = document.createElement('meta');
        meta.name = 'description';
        meta.content = description;
        document.head.appendChild(meta);
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', keywords);
    else {
        const meta = document.createElement('meta');
        meta.name = 'keywords';
        meta.content = keywords;
        document.head.appendChild(meta);
    }

    // Update JSON-LD Script
    const existingScript = document.getElementById('google-structured-data');
    if (existingScript) existingScript.remove();

    if (structuredData) {
      const script = document.createElement('script');
      script.id = 'google-structured-data';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }

  }, [activeView, activeJob, activeRegion]);

  return null;
};

export default SEOManager;
