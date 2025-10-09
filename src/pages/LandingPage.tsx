import React from 'react'
import { BarChart3, Users, Bot, Phone, TrendingUp, CheckCircle, Star, ArrowRight, Play } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LandingNav } from '../components/Layout/LandingNav'
import { LandingFooter } from '../components/Layout/LandingFooter'

interface LandingPageProps {
  onLogin: () => void
  onGetStarted: () => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onGetStarted }) => {
  const features = [
    {
      icon: BarChart3,
      title: 'Real-Time Rate Monitoring',
      description: 'Track 30yr, FHA, VA, and 15yr rates with instant alerts when your client\'s target rates are hit.',
      gradient: 'from-blue-600 to-indigo-600'
    },
    {
      icon: Users,
      title: 'Advanced CRM',
      description: 'Complete pipeline management from prospect to closing with automated follow-up reminders.',
      gradient: 'from-green-600 to-emerald-600'
    },
    {
      icon: Bot,
      title: 'AI Portfolio Assistant',
      description: 'Get intelligent insights about your clients, identify opportunities, and receive personalized recommendations.',
      gradient: 'from-purple-600 to-pink-600'
    },
    {
      icon: Phone,
      title: 'Automated Calling',
      description: 'AI-powered automated calls to clients when their target rates are achieved, saving hours of manual work.',
      gradient: 'from-orange-600 to-red-600'
    }
  ]

  const benefits = [
    'Save 10+ hours per week with automation',
    'Never miss a rate opportunity again',
    'Increase conversion rates by 35%',
    'Professional AI-powered insights',
    '24/7 rate monitoring and alerts',
    'Complete client relationship management'
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      title: "Senior Loan Officer",
      company: "Premier Mortgage Group",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote: "Rate Monitor Pro has transformed my business. I'm closing 40% more loans and saving 15 hours per week on follow-ups. The AI calling feature alone pays for itself.",
      rating: 5
    },
    {
      name: "Michael Chen",
      title: "Mortgage Broker",
      company: "Elite Home Loans",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote: "Never miss a rate opportunity again. The real-time alerts and automated client outreach have increased my conversion rate by 35%. Best investment I've made.",
      rating: 5
    },
    {
      name: "Jennifer Rodriguez",
      title: "Branch Manager",
      company: "Coastal Mortgage Solutions",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote: "The AI insights are incredible. It tells me exactly which clients to call and when. My team's productivity has doubled since we started using Rate Monitor Pro.",
      rating: 5
    }
  ]

  const companies = [
    "Quicken Loans", "Wells Fargo", "Chase", "Bank of America", "Rocket Mortgage", "loanDepot"
  ]

  const faqs = [
    {
      question: "How does the AI calling feature work?",
      answer: "Our AI automatically calls your clients when their target rates are reached using natural-sounding voice technology. It delivers personalized messages and schedules follow-ups, saving you hours of manual calling."
    },
    {
      question: "Can I integrate with my existing CRM?",
      answer: "Rate Monitor Pro includes a complete CRM system, but we also offer API integrations with popular mortgage CRMs. Our support team can help you migrate your existing data seamlessly."
    },
    {
      question: "How accurate are the rate updates?",
      answer: "We pull rates from multiple sources every 15 minutes, ensuring you have the most current market data. Our system monitors 30yr, FHA, VA, and 15yr rates with 99.9% uptime."
    },
    {
      question: "Is there a setup fee or contract?",
      answer: "No setup fees, no contracts. Pay month-to-month and cancel anytime. We offer a 14-day free trial and 30-day money-back guarantee."
    },
    {
      question: "What kind of support do you provide?",
      answer: "All subscribers get priority email support, live chat, and access to our knowledge base. We also offer onboarding calls and training sessions to help you maximize your results."
    },
    {
      question: "How much time will this save me?",
      answer: "Our users report saving 10-15 hours per week on client management, rate monitoring, and follow-ups. The automation handles routine tasks so you can focus on closing deals."
    }
  ]

  return (
    <div className="min-h-screen">
      <LandingNav onLogin={onLogin} onGetStarted={onGetStarted} />
      
      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 pt-16">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Rate Monitor
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent"> Pro</span>
            </h1>
            
            <p className="text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              The most advanced mortgage rate monitoring and CRM platform. 
              Automate your workflow, never miss opportunities, and grow your business with AI-powered insights.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Button 
                size="lg" 
                onClick={() => onGetStarted(true)}
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg border-2 border-white text-white hover:bg-white hover:text-gray-900"
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            <p className="text-gray-400 mt-6">
              14-day free trial • Cancel anytime
            </p>
            
            {/* Social Proof */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <p className="text-gray-400 mb-6">Trusted by 500+ mortgage professionals</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                {companies.map((company, index) => (
                  <div key={index} className="text-gray-300 font-medium">
                    {company}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Scale Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built specifically for mortgage professionals who want to work smarter, not harder.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-200">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Why Top Mortgage Professionals Choose Rate Monitor Pro
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-green-600 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  Average Results
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Time Saved Weekly</span>
                    <span className="text-2xl font-bold text-green-600">10+ hours</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Conversion Increase</span>
                    <span className="text-2xl font-bold text-green-600">35%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Revenue Growth</span>
                    <span className="text-2xl font-bold text-green-600">$50K+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Mortgage Professionals Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how Rate Monitor Pro is transforming businesses across the industry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-400 mb-12">
            One plan with everything you need. No hidden fees, no surprises.
          </p>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">Rate Monitor Pro</h3>
            <div className="text-6xl font-bold mb-2">$97</div>
            <div className="text-blue-200 mb-8">per month</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Real-time rate monitoring</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Complete CRM system</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>AI portfolio assistant</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Automated calling</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Email automation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Priority support</span>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              onClick={onGetStarted}
              className="px-12 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Start 14-Day Free Trial
            </Button>
            
            <p className="text-blue-200 mt-4 text-sm">
              Cancel anytime. No setup fees. Money-back guarantee.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Rate Monitor Pro
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

 {/* CTA Section */}
 <div className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Mortgage Business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of mortgage professionals who are already using Rate Monitor Pro to grow their business.
          </p>
          <Button 
            size="lg" 
            onClick={() => onGetStarted(true)}
            className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <LandingFooter onLogin={onLogin} />
    </div>
  )
}