import React, { useEffect } from 'react';
import { View, Job } from '../types';

interface SEOManagerProps {
  activeView: View;
  activeJob?: Job;
  activeRegion?: string;
}

const SEOManager: React.FC<SEOManagerProps> = ({ activeView, activeJob, activeRegion }) => {
  useEffect(() => {
    let title = 'Alpha Consortium | International HR & Manpower Ecosystem';
    let description = 'Connecting skilled talent from Bangladesh and Nepal with ethical employment opportunities in the Balkan region. AI-powered recruitment and relocation.';
    let structuredData: any = null;

    switch (activeView) {
      case View.Jobs:
        title = 'Browse International Jobs | Alpha Consortium';
        description = 'Search verified jobs in the Balkan region for skilled professionals. Filter by category, location, and salary.';
        break;
      case View.VisaTrack:
        title = activeRegion 
          ? `Work Visa & Relocation Guide for ${activeRegion} | Alpha Consortium`
          : 'Balkan Bridge: International Relocation AI | Alpha Consortium';
        description = `Step-by-step AI-powered guide for moving to ${activeRegion || 'the Balkan region'}. Required documents, cultural tips, and embassy prep.`;
        break;
      case View.Academy:
        title = 'Skill Development & Certifications | Alpha Academy';
        description = 'Elevate your career with expert-led courses designed for the international job market.';
        break;
      case View.PostJob:
        title = 'Post a Job & Hire Top Talent | Alpha Consortium';
        description = 'Recruit skilled talent from South Asia. Use AI to optimize your job listings for better visibility.';
        break;
      case View.MarketTrends:
        title = 'Real-time Job Market Analytics | Alpha Consortium';
        description = 'AI-driven insights into global employment trends, salary data, and emerging skill demands.';
        break;
    }

    // Individual Job SEO (if a job is selected/focused)
    if (activeJob) {
      title = `${activeJob.title} at ${activeJob.company} | Jobs in ${activeJob.location}`;
      description = `Join ${activeJob.company} as a ${activeJob.title} in ${activeJob.location}. Apply now through Alpha Consortium.`;
      
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
          "sameAs": activeJob.hiringOrganization?.sameAs || "https://alphaconsortium.com"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": activeJob.location.split(',')[0].trim(),
            "addressRegion": activeJob.location.split(',')[1]?.trim() || "",
            "streetAddress": "Remote"
          }
        },
        "baseSalary": activeJob.salaryMin ? {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": activeJob.salaryMin,
            "maxValue": activeJob.salaryMax,
            "unitText": "YEAR"
          }
        } : undefined
      };
    }

    // Update Meta Tags
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

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