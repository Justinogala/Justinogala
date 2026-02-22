import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Product Manager at TechFlow",
    avatar: "https://i.pravatar.cc/150?u=sarah",
    quote: "Munal has completely transformed how our product team operates. The automated summaries save us hours of documentation time every week.",
    rating: 5
  },
  {
    name: "David Chen",
    role: "CTO at StartScale",
    avatar: "https://i.pravatar.cc/150?u=david",
    quote: "The accuracy of the transcription is incredible, even with technical jargon. It's become an indispensable tool for our engineering syncs.",
    rating: 5
  },
  {
    name: "Elena Rodriguez",
    role: "Sales Director at GlobalCorp",
    avatar: "https://i.pravatar.cc/150?u=elena",
    quote: "Being able to search through past client calls instantly has improved our sales follow-up process dramatically. Highly recommended!",
    rating: 5
  },
  {
    name: "Michael Chang",
    role: "Lead Designer at CreativeStudio",
    avatar: "https://i.pravatar.cc/150?u=michael",
    quote: "The interface is beautiful and intuitive. It integrates perfectly with our existing workflow tools. A true game-changer.",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-gray-50 dark:bg-slate-950">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4 text-gray-900 dark:text-white">
            Loved by Industry Leaders
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See what our users are saying about their experience with Munal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <Card className="h-full border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-slate-900">
                <CardContent className="p-8 flex flex-col h-full">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-1" />
                    ))}
                  </div>
                  
                  <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-6 flex-grow leading-relaxed italic">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center mt-auto">
                    <Avatar className="h-12 w-12 mr-4 border-2 border-violet-100">
                      <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;