import React from 'react'
import { BarChart3, Users, Bot, Phone, TrendingUp, CheckCircle, Star, ArrowRight, Play } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LandingNav } from '../components/Layout/LandingNav'
import { LandingFooter } from '../components/Layout/LandingFooter'

interface LandingPageProps {
  onLogin: () => void
  onGetStarted: () => void
  onLegalClick: (page: 'privacy' | 'terms' | 'cookies' | 'compliance') => void
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onLogin, 
  onGetStarted, 
  onLegalClick
}) => {
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
    'Save hours per week with automation',
    'Monitor rates 24/7 so you don\'t have to',
    'Help capture more opportunities',
    'Professional AI-powered insights',
    'Automated rate alerts and follow-ups',
    'Complete client relationship management'
  ]

  const testimonials = [
    {
      name: "M.C.",
      title: "Loan Officer",
      company: "California",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote: "This tool has completely changed how I manage my pipeline. The automated alerts mean I never miss a rate opportunity, and the CRM keeps everything organized.",
      rating: 5
    },
    {
      name: "J.T.",
      title: "Mortgage Broker",
      company: "Texas",
      image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote: "Real-time monitoring and automated outreach have made my workflow so much more efficient. Great investment for any serious mortgage professional.",
      rating: 5
    },
    {
      name: "K.R.",
      title: "Senior Loan Officer",
      company: "Florida",
      image: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop",
      quote: "The AI insights help me prioritize which clients to reach out to. Everything I need in one place - monitoring, CRM, and automation.",
      rating: 5
    }
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
      answer: "We aggregate rates from multiple market sources and update frequently to ensure you have current market data. Our system monitors 30yr, FHA, VA, and 15yr rates with high reliability."
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
      answer: "Our users report significant time savings on client management, rate monitoring, and follow-ups. The automation handles routine tasks so you can focus on closing deals."
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
            
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={onGetStarted}
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            
            <p className="text-gray-400 mt-6">
              14-day free trial • Cancel anytime
            </p>
            
           
            {/* Social Proof - Modern Cards */}
            <div className="mt-16">
              <p className="text-gray-400 mb-8 text-lg">Everything you need to never miss a rate opportunity</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="text-3xl font-bold text-blue-400 mb-2">4 Loan Types</div>
                  <div className="text-sm text-gray-300">30yr • FHA • VA • 15yr</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
                  <div className="text-sm text-gray-300">Automated Monitoring</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all">
                  <div className="text-3xl font-bold text-purple-400 mb-2">Instant</div>
                  <div className="text-sm text-gray-300">Email & AI Call Alerts</div>
                </div>
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

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built by Mortgage Professionals, For Mortgage Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We understand the challenges of managing rate-sensitive clients because we've been there. 
              Rate Monitor Pro was created to solve the real problems mortgage professionals face every day: 
              missed opportunities, time-consuming follow-ups, and inefficient client management.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">Real-Time</div>
              <div className="text-gray-600">Rate Updates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">Automated</div>
              <div className="text-gray-600">Client Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">AI-Powered</div>
              <div className="text-gray-600">Insights</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-8">
                Why Mortgage Professionals Choose Rate Monitor Pro
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
            
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-8 shadow-2xl text-white">
  <div className="text-center">
    <h3 className="text-3xl font-bold mb-6">
      Your Daily Workflow
    </h3>
    <div className="space-y-6 text-left">
      <div className="flex items-start space-x-4">
        <div className="bg-white/20 rounded-full p-2 mt-1">
          <span className="text-xl font-bold">1</span>
        </div>
        <div>
          <div className="font-semibold text-lg">Set Target Rates</div>
          <div className="text-blue-100 text-sm">Add clients and their ideal rates</div>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="bg-white/20 rounded-full p-2 mt-1">
          <span className="text-xl font-bold">2</span>
        </div>
        <div>
          <div className="font-semibold text-lg">We Monitor 24/7</div>
          <div className="text-blue-100 text-sm">Rates checked every 15 minutes</div>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="bg-white/20 rounded-full p-2 mt-1">
          <span className="text-xl font-bold">3</span>
        </div>
        <div>
          <div className="font-semibold text-lg">Get Instant Alerts</div>
          <div className="text-blue-100 text-sm">Email notifications when rates hit</div>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="bg-white/20 rounded-full p-2 mt-1">
          <span className="text-xl font-bold">4</span>
        </div>
        <div>
          <div className="font-semibold text-lg">Close More Deals</div>
          <div className="text-blue-100 text-sm">Never miss an opportunity</div>
        </div>
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
              Early users are already seeing results with Rate Monitor Pro
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
            Join mortgage professionals who are using Rate Monitor Pro to streamline their workflow.
          </p>
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Get Started Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <LandingFooter 
        onLogin={onLogin} 
        onLegalClick={onLegalClick}
      />
    </div>
  )
}