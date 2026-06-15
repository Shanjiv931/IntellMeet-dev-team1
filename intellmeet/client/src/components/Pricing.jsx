import React from 'react';
import './Pricing.css';

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      desc: "Perfect for freelancers and small teams getting started with meeting intelligence.",
      features: [
        "Up to 40 minutes per meeting",
        "Standard audio and video quality",
        "Live speech-to-text transcription",
        "resilient local storage fallback"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Professional",
      price: "$15",
      period: "per user / month",
      desc: "Ideal for growing startups and businesses looking to automate administrative overhead.",
      features: [
        "Unlimited meeting duration",
        "High-fidelity HD video & audio",
        "Google Gemini-powered AI meeting summaries",
        "Kanban task board synchronization",
        "Priority customer support"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "tailored scaling",
      desc: "Designed for large organizations requiring advanced security and massive participant capacities.",
      features: [
        "Supports 5,000+ concurrent participants",
        "Enterprise-grade GDPR, SOC2 & HIPAA compliance",
        "Dedicated account manager",
        "Advanced user session logs auditing",
        "Custom API & webhook integrations"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <section className="pricing-section" id="pricing">
      <div className="container">
        <div className="section-header text-center">
          <span className="section-pre">Flexible Pricing</span>
          <h2 className="section-title">Designed to Scale with Your Team</h2>
          <p className="section-desc">
            Choose the perfect plan to streamline your meeting administrative operations, whether you are a team of two or a global enterprise.
          </p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan, idx) => (
            <div key={idx} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="popular-badge">Most Popular</span>}
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  <span className="price-num">{plan.price}</span>
                  <span className="price-period">/ {plan.period}</span>
                </div>
                <p className="plan-desc">{plan.desc}</p>
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx}>
                    <svg className="feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`btn-pricing-cta ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
