import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Footer from '../components/Footer';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <Hero />
        
        {/* Simple CTA middle divider strip */}
        <section className="cta-divider" id="solutions">
          <div className="container cta-divider-container">
            <h3>Ready to run meetings on autopilot?</h3>
            <p>Join thousands of professionals saving up to 5 hours of admin work every single week.</p>
            <button className="btn-primary">Create Your Account</button>
          </div>
        </section>

        <Features />
      </main>
      <Footer />
    </div>
  );
}
