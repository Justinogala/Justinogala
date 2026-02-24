import React, { useState } from 'react';
import { 
  Brain, Sparkles, ListChecks, MessageSquare, TrendingUp, Users, 
  HelpCircle, CheckCircle2, Loader2, ChevronDown, ChevronUp,
  AlertCircle, Target, Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = window.location.origin;

const TranscriptAnalysis = ({ transcriptionText, transcriptionId }) => {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    key_points: true,
    action_items: true,
    sentiment: false,
    topics: false,
    speakers: false,
    questions: false,
    decisions: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const analyzeTranscript = async () => {
    if (!transcriptionText || transcriptionText.trim().length < 50) {
      toast({
        variant: "destructive",
        title: "Not enough text",
        description: "Please provide more transcript text for analysis."
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/transcripts/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: transcriptionText,
          analysis_types: ["summary", "key_points", "action_items", "sentiment", "topics"]
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        toast({
          title: "Analysis complete",
          description: "Your transcript has been analyzed successfully."
        });
      } else {
        throw new Error('Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "Could not analyze the transcript. Please try again."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'negative': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    }
  };

  const SectionHeader = ({ icon: Icon, title, section, count }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-indigo-500" />
        <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
        {count !== undefined && (
          <Badge variant="secondary" className="ml-2">{count}</Badge>
        )}
      </div>
      {expandedSections[section] ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Analysis Button */}
      {!analysis && (
        <Card className="border-dashed border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardContent className="p-6 text-center">
            <Brain className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              AI Transcript Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Get AI-powered insights including summary, key points, action items, sentiment analysis, and more.
            </p>
            <Button 
              onClick={analyzeTranscript}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Transcript
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Re-analyze Button */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              Analysis Results
            </h3>
            <Button variant="outline" size="sm" onClick={analyzeTranscript} disabled={isAnalyzing}>
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Re-analyze
            </Button>
          </div>

          {/* Summary */}
          {analysis.summary && (
            <Card>
              <SectionHeader icon={Lightbulb} title="Summary" section="summary" />
              <AnimatePresence>
                {expandedSections.summary && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {analysis.summary}
                      </p>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Key Points */}
          {analysis.key_points?.length > 0 && (
            <Card>
              <SectionHeader icon={Target} title="Key Points" section="key_points" count={analysis.key_points.length} />
              <AnimatePresence>
                {expandedSections.key_points && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <ul className="space-y-2">
                        {analysis.key_points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                            <span className="text-gray-700 dark:text-gray-300">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Action Items */}
          {analysis.action_items?.length > 0 && (
            <Card>
              <SectionHeader icon={ListChecks} title="Action Items" section="action_items" count={analysis.action_items.length} />
              <AnimatePresence>
                {expandedSections.action_items && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-3">
                        {analysis.action_items.map((item, idx) => (
                          <div key={idx} className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white font-medium">{item.task}</p>
                              {item.assignee && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  Assigned to: {item.assignee}
                                </p>
                              )}
                            </div>
                            {item.priority && (
                              <Badge className={cn("ml-2", getPriorityColor(item.priority))}>
                                {item.priority}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Sentiment Analysis */}
          {analysis.sentiment && (
            <Card>
              <SectionHeader icon={TrendingUp} title="Sentiment Analysis" section="sentiment" />
              <AnimatePresence>
                {expandedSections.sentiment && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="flex items-center gap-4 mb-4">
                        <Badge className={cn("text-sm px-3 py-1", getSentimentColor(analysis.sentiment.overall))}>
                          {analysis.sentiment.overall?.charAt(0).toUpperCase() + analysis.sentiment.overall?.slice(1) || 'Neutral'}
                        </Badge>
                        {analysis.sentiment.score !== undefined && (
                          <div className="flex-1">
                            <Progress value={analysis.sentiment.score * 100} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              Confidence: {Math.round(analysis.sentiment.score * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                      {analysis.sentiment.highlights?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Highlights:</p>
                          {analysis.sentiment.highlights.map((highlight, idx) => (
                            <p key={idx} className="text-sm text-gray-600 dark:text-gray-400 pl-4 border-l-2 border-indigo-300">
                              {highlight}
                            </p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Topics */}
          {analysis.topics?.length > 0 && (
            <Card>
              <SectionHeader icon={MessageSquare} title="Topics Discussed" section="topics" count={analysis.topics.length} />
              <AnimatePresence>
                {expandedSections.topics && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="flex flex-wrap gap-2">
                        {analysis.topics.map((topic, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1.5">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {topic.name || topic}
                            </span>
                            {topic.relevance !== undefined && (
                              <span className="text-xs text-gray-500">
                                {Math.round(topic.relevance * 100)}%
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Speakers */}
          {analysis.speakers?.length > 0 && (
            <Card>
              <SectionHeader icon={Users} title="Speaker Analysis" section="speakers" count={analysis.speakers.length} />
              <AnimatePresence>
                {expandedSections.speakers && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <div className="space-y-4">
                        {analysis.speakers.map((speaker, idx) => (
                          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 dark:text-white">{speaker.name}</span>
                              {speaker.talk_time_percent !== undefined && (
                                <span className="text-sm text-gray-500">{speaker.talk_time_percent}% talk time</span>
                              )}
                            </div>
                            {speaker.key_contributions?.length > 0 && (
                              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                {speaker.key_contributions.map((contrib, cidx) => (
                                  <li key={cidx}>• {contrib}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Questions Raised */}
          {analysis.questions_raised?.length > 0 && (
            <Card>
              <SectionHeader icon={HelpCircle} title="Questions Raised" section="questions" count={analysis.questions_raised.length} />
              <AnimatePresence>
                {expandedSections.questions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <ul className="space-y-2">
                        {analysis.questions_raised.map((question, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <HelpCircle className="w-4 h-4 text-orange-500 mt-1 shrink-0" />
                            {question}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}

          {/* Decisions Made */}
          {analysis.decisions_made?.length > 0 && (
            <Card>
              <SectionHeader icon={CheckCircle2} title="Decisions Made" section="decisions" count={analysis.decisions_made.length} />
              <AnimatePresence>
                {expandedSections.decisions && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <CardContent className="pt-0 pb-4 px-4">
                      <ul className="space-y-2">
                        {analysis.decisions_made.map((decision, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                            {decision}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default TranscriptAnalysis;
