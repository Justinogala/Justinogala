import React from 'react';
import './HeroBackground.css';

const HeroBackground = () => {
  return (
    <div className="hero-bg" aria-hidden="true">
      {/* === A: Floating Gradient Orbs === */}
      <div className="hero-orb hero-orb--1" />
      <div className="hero-orb hero-orb--2" />
      <div className="hero-orb hero-orb--3" />
      <div className="hero-orb hero-orb--4" />
      <div className="hero-orb hero-orb--5" />

      {/* === B: Particle Field === */}
      <div className="hero-particles">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className={`hero-particle hero-particle--${i % 8}`} style={{
            left: `${(i * 2.5) % 100}%`,
            animationDelay: `${(i * 0.4) % 6}s`,
            animationDuration: `${6 + (i % 5) * 2}s`,
          }} />
        ))}
        {/* Connecting line grid (subtle) */}
        <svg className="hero-grid-lines" viewBox="0 0 1920 900" preserveAspectRatio="none">
          <line x1="0" y1="300" x2="1920" y2="300" className="hero-grid-line hero-grid-line--h1" />
          <line x1="0" y1="600" x2="1920" y2="600" className="hero-grid-line hero-grid-line--h2" />
          <line x1="480" y1="0" x2="480" y2="900" className="hero-grid-line hero-grid-line--v1" />
          <line x1="960" y1="0" x2="960" y2="900" className="hero-grid-line hero-grid-line--v2" />
          <line x1="1440" y1="0" x2="1440" y2="900" className="hero-grid-line hero-grid-line--v3" />
        </svg>
      </div>

      {/* === C: Animated Wave === */}
      <div className="hero-wave-container">
        <svg className="hero-wave hero-wave--1" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1350,30 1440,60 L1440,120 L0,120 Z" />
        </svg>
        <svg className="hero-wave hero-wave--2" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,80 C240,20 480,100 720,60 C960,20 1200,100 1440,80 L1440,120 L0,120 Z" />
        </svg>
        <svg className="hero-wave hero-wave--3" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,90 C180,50 360,110 540,70 C720,30 900,110 1080,70 C1260,30 1350,90 1440,70 L1440,120 L0,120 Z" />
        </svg>
      </div>
    </div>
  );
};

export default HeroBackground;
