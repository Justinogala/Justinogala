import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, ArrowRight, Search, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PageTransition from '@/components/PageTransition';

const blogPosts = [
  {
    id: 'ai-meeting-intelligence-2026',
    title: 'The State of AI Meeting Intelligence in 2026: What Every Organization Should Know',
    excerpt: 'From real-time transcription to predictive action items, AI meeting tools have matured rapidly. We break down where the industry stands and what comes next.',
    category: 'AI & Innovation',
    date: 'Mar 22, 2026',
    readTime: '8 min read',
    author: 'Dr. Sarah Chen',
    authorRole: 'Chief AI Officer',
    image: 'https://images.unsplash.com/photo-1748256467077-c75ef01579aa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwd29ya3BsYWNlJTIwaW5ub3ZhdGlvbnxlbnwwfHx8fDE3NzQ1NzAxOTh8MA&ixlib=rb-4.1.0&q=85',
    featured: true,
  },
  {
    id: 'remote-work-infrastructure',
    title: 'Building Resilient Remote Work Infrastructure: Lessons from 500+ Distributed Teams',
    excerpt: 'We surveyed 500 remote-first organizations to discover what separates thriving distributed teams from struggling ones. Hint: it starts with communication tooling.',
    category: 'Remote Work',
    date: 'Mar 18, 2026',
    readTime: '6 min read',
    author: 'James Whitfield',
    authorRole: 'VP of Engineering',
    image: 'https://images.unsplash.com/photo-1593642633279-1796119d5482?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYnVzaW5lc3MlMjBkaWdpdGFsfGVufDB8fHx8MTc3NDU3MDE5N3ww&ixlib=rb-4.1.0&q=85',
    featured: false,
  },
  {
    id: 'healthcare-digital-transformation',
    title: 'Digital Transformation in Healthcare: How AI Documentation is Reducing Physician Burnout',
    excerpt: 'Clinicians spend 2 hours daily on documentation. New AI-powered tools are cutting that in half while improving accuracy and compliance outcomes.',
    category: 'Healthcare',
    date: 'Mar 14, 2026',
    readTime: '7 min read',
    author: 'Dr. Amara Osei',
    authorRole: 'Healthcare Strategy Lead',
    image: 'https://images.unsplash.com/photo-1559137771-536eecb999ab?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHw0fHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwd29ya3BsYWNlJTIwaW5ub3ZhdGlvbnxlbnwwfHx8fDE3NzQ1NzAxOTh8MA&ixlib=rb-4.1.0&q=85',
    featured: false,
  },
  {
    id: 'ai-governance-compliance',
    title: 'AI Governance and Compliance: Navigating the New Regulatory Landscape',
    excerpt: 'The EU AI Act, SEC AI disclosure rules, and emerging global standards are reshaping how organizations deploy AI. Here is your practical compliance roadmap.',
    category: 'Compliance',
    date: 'Mar 10, 2026',
    readTime: '9 min read',
    author: 'Priya Kapoor',
    authorRole: 'Head of Compliance',
    image: 'https://images.unsplash.com/photo-1758691736821-f1a600c0c3f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwyfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwd29ya3BsYWNlJTIwaW5ub3ZhdGlvbnxlbnwwfHx8fDE3NzQ1NzAxOTh8MA&ixlib=rb-4.1.0&q=85',
    featured: false,
  },
  {
    id: 'future-workforce-management',
    title: 'The Future of Workforce Management: AI Scheduling, Predictive Staffing, and Beyond',
    excerpt: 'Manual scheduling is a relic. Leading organizations are using AI to predict staffing needs, optimize shift coverage, and reduce overtime costs by 40%.',
    category: 'Workforce',
    date: 'Mar 6, 2026',
    readTime: '5 min read',
    author: 'Marcus Rivera',
    authorRole: 'Product Lead',
    image: 'https://images.unsplash.com/photo-1573757056004-065ad36e2cf4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwYnVzaW5lc3MlMjBkaWdpdGFsfGVufDB8fHx8MTc3NDU3MDE5N3ww&ixlib=rb-4.1.0&q=85',
    featured: false,
  },
  {
    id: 'ai-education-revolution',
    title: 'How AI is Revolutionizing Higher Education: From Lecture Capture to Personalized Learning',
    excerpt: 'Universities are deploying AI to transcribe lectures, generate study guides, and create accessible learning materials. The results are transformative.',
    category: 'Education',
    date: 'Mar 2, 2026',
    readTime: '6 min read',
    author: 'Prof. Thomas Erikson',
    authorRole: 'Education Advisor',
    image: 'https://images.unsplash.com/photo-1771918050103-57b5de00d960?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwzfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwd29ya3BsYWNlJTIwaW5ub3ZhdGlvbnxlbnwwfHx8fDE3NzQ1NzAxOTh8MA&ixlib=rb-4.1.0&q=85',
    featured: false,
  },
  {
    id: 'government-digital-modernization',
    title: 'Government Digital Modernization: Making Public Proceedings Transparent with AI',
    excerpt: 'Cities and agencies are using AI transcription to publish meeting minutes faster, improve FOIA response times, and make government more accessible to citizens.',
    category: 'Government',
    date: 'Feb 26, 2026',
    readTime: '7 min read',
    author: 'Maria Gonzalez',
    authorRole: 'Public Sector Lead',
    image: 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    featured: false,
  },
  {
    id: 'cybersecurity-ai-era',
    title: 'Cybersecurity in the AI Era: Protecting Sensitive Meeting Data at Scale',
    excerpt: 'As organizations record and transcribe more meetings, the attack surface grows. We explore zero-trust architectures, encryption standards, and RBAC best practices.',
    category: 'Security',
    date: 'Feb 22, 2026',
    readTime: '8 min read',
    author: 'Alex Novak',
    authorRole: 'Security Architect',
    image: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    featured: false,
  },
  {
    id: 'voice-ai-enterprise',
    title: 'Voice AI in the Enterprise: Why Speech-to-Text Accuracy Finally Crossed the 99% Threshold',
    excerpt: 'After years of incremental gains, enterprise speech recognition has hit a tipping point. We explain the technical breakthroughs and what it means for your workflows.',
    category: 'AI & Innovation',
    date: 'Feb 18, 2026',
    readTime: '5 min read',
    author: 'Dr. Sarah Chen',
    authorRole: 'Chief AI Officer',
    image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    featured: false,
  },
  {
    id: 'legal-tech-ai-practice',
    title: 'Legal Tech Revolution: How AI Is Transforming Depositions, Discovery, and Case Research',
    excerpt: 'Law firms that adopted AI documentation tools report 80% faster deposition review and 40% reduction in billable admin hours. Inside the numbers.',
    category: 'Legal',
    date: 'Feb 14, 2026',
    readTime: '6 min read',
    author: 'David Park, Esq.',
    authorRole: 'Legal Tech Advisor',
    image: 'https://images.pexels.com/photos/5668859/pexels-photo-5668859.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    featured: false,
  },
  {
    id: 'fintech-compliance-automation',
    title: 'FinTech Compliance Automation: From Investment Committees to Regulatory Submissions',
    excerpt: 'SEC, MiFID II, and Dodd-Frank demand meticulous records. How leading funds use AI to capture every investment discussion and stay perpetually audit-ready.',
    category: 'Finance',
    date: 'Feb 10, 2026',
    readTime: '7 min read',
    author: 'Amanda Torres',
    authorRole: 'Financial Services Lead',
    image: 'https://images.pexels.com/photos/7567434/pexels-photo-7567434.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    featured: false,
  },
  {
    id: 'building-inclusive-tech-teams',
    title: 'Building Inclusive Tech Teams: How AI Interview Tools Are Reducing Hiring Bias',
    excerpt: 'Structured scorecards, talk-time analysis, and question consistency tracking are helping organizations build more equitable and effective hiring processes.',
    category: 'HR & Culture',
    date: 'Feb 6, 2026',
    readTime: '5 min read',
    author: 'Rachel Kim',
    authorRole: 'Head of Talent',
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    featured: false,
  },
];

const categories = ['All', ...new Set(blogPosts.map(p => p.category))];

const categoryColors = {
  'AI & Innovation': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
  'Remote Work': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  'Healthcare': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  'Compliance': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  'Workforce': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  'Education': 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  'Government': 'bg-slate-100 dark:bg-slate-700/30 text-slate-700 dark:text-slate-300',
  'Security': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  'Legal': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  'Finance': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  'HR & Culture': 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
};

const Blog = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const featured = blogPosts.find(p => p.featured);
  const regularPosts = blogPosts.filter(p => !p.featured);

  const filteredPosts = regularPosts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col font-sans">
        <Helmet><title>Blog & Insights - Munal AI</title></Helmet>
        <Header />

        <main className="flex-grow" data-testid="blog-page">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
            <div className="container mx-auto px-6 py-4">
              <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Link to="/" className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-gray-900 dark:text-white">Blog</span>
              </nav>
            </div>
          </div>

          {/* Hero */}
          <section className="relative py-20 lg:py-28 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-transparent to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10 pointer-events-none" />
            <div className="container mx-auto px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-medium mb-6">
                    Blog & Insights
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading mb-6 text-gray-900 dark:text-white leading-tight">
                    Stories from the
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600"> Future of Work</span>
                  </h1>
                  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    Deep dives into AI, modern ICT, workforce management, and the technologies transforming how teams collaborate and get work done.
                  </p>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                      data-testid="blog-search"
                    />
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-violet-600 to-purple-700 rounded-2xl blur-3xl -z-10 opacity-20" />
                  <img
                    src={featured.image}
                    alt="AI-powered workplace"
                    className="rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full object-cover aspect-video hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                  />
                </motion.div>
              </div>
            </div>
          </section>

          {/* Featured Post */}
          <section className="py-16 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Card className="overflow-hidden hover:shadow-2xl transition-all cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid="featured-post">
                  <div className="grid md:grid-cols-2">
                    <div className="relative overflow-hidden">
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full shadow-lg">
                          Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit mb-4 ${categoryColors[featured.category]}`}>
                        {featured.category}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                        {featured.title}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">{featured.excerpt}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-sm">
                            {featured.author[0]}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{featured.author}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{featured.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-400">
                          <Clock className="w-4 h-4 mr-1" />
                          {featured.readTime}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </section>

          {/* Category Filter */}
          <section className="bg-white dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800 sticky top-0 z-20">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-2 py-4 overflow-x-auto no-scrollbar" data-testid="category-filters">
                <Tag className="w-4 h-4 text-gray-400 shrink-0" />
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      activeCategory === cat
                        ? 'bg-violet-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600'
                    }`}
                    data-testid={`filter-${cat.toLowerCase().replace(/[\s&]+/g, '-')}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Blog Grid */}
          <section className="py-20 bg-gray-50 dark:bg-slate-950">
            <div className="container mx-auto px-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No articles found matching your criteria.</p>
                  <Button variant="outline" className="mt-4" onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredPosts.map((post, idx) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.06 }}
                    >
                      <Card className="h-full overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900" data-testid={`blog-card-${idx}`}>
                        <div className="relative overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${categoryColors[post.category]}`}>
                              {post.category}
                            </span>
                          </div>
                        </div>
                        <CardContent className="p-6 flex flex-col h-[calc(100%-12rem)]">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed line-clamp-3 flex-grow">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-xs">
                                {post.author[0]}
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-900 dark:text-white">{post.author}</div>
                                <div className="text-[10px] text-gray-400">{post.date}</div>
                              </div>
                            </div>
                            <span className="flex items-center text-xs text-gray-400">
                              <Clock className="w-3 h-3 mr-1" />{post.readTime}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Newsletter CTA */}
          <section className="py-20 bg-gradient-to-r from-violet-600 to-purple-700 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            <div className="container mx-auto px-6 relative z-10 text-center">
              <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                Stay Ahead of the Curve
              </h2>
              <p className="text-xl text-violet-100 mb-10 max-w-2xl mx-auto">
                Get the latest insights on AI, ICT innovation, and workforce technology delivered to your inbox every week.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Input placeholder="Enter your email" className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 flex-grow" data-testid="newsletter-email" />
                <Button size="lg" className="bg-white text-violet-600 hover:bg-gray-100 shadow-xl px-8 h-12 shrink-0" data-testid="newsletter-subscribe">
                  Subscribe
                </Button>
              </div>
              <p className="text-xs text-violet-200 mt-4">No spam. Unsubscribe anytime.</p>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </PageTransition>
  );
};

export default Blog;
