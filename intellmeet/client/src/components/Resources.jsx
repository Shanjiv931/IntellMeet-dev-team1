import React from 'react';
import './Resources.css';

export default function Resources() {
  const items = [
    {
      category: "Guides",
      title: "Mastering Video Meeting Presence",
      desc: "Learn actionable tips for remote speaking ratios, visual presence, and screen share techniques.",
      linkText: "Read Article"
    },
    {
      category: "Documentation",
      title: "API Developer Integrations Guide",
      desc: "Configure security webhooks, setup OAuth credentials, and stream meeting logs directly to external CDNs.",
      linkText: "View Docs"
    },
    {
      category: "Case Study",
      title: "ApexHub: Scaling to 5,000 Users",
      desc: "See how ApexHub transitioned townhall presentations to webinar modes successfully using IntellMeet's broadcast layer.",
      linkText: "Read Case Study"
    }
  ];

  return (
    <section className="resources-section" id="resources">
      <div className="container">
        <div className="section-header">
          <span className="section-pre">Knowledge Base</span>
          <h2 className="section-title">Resources & Insights</h2>
          <p className="section-desc">
            Explore developer documents, case studies, and productivity tips to help your enterprise succeed in a remote-first workspace.
          </p>
        </div>

        <div className="resources-grid">
          {items.map((item, idx) => (
            <div key={idx} className="resource-card">
              <div className="resource-body">
                <span className="resource-cat">{item.category}</span>
                <h3 className="resource-title">{item.title}</h3>
                <p className="resource-desc">{item.desc}</p>
              </div>
              <div className="resource-footer">
                <a href="#" className="resource-link" onClick={(e) => e.preventDefault()}>
                  <span>{item.linkText}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
