import React from 'react';
import { ArrowLeft, Shield, FileText, Cookie, CheckCircle, Scale } from 'lucide-react';

interface LegalPageProps {
  onBack: () => void;
}

// Privacy Policy Page
export const PrivacyPolicyPage: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">Last updated: October 8, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Rate Monitor Pro ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mortgage rate monitoring and CRM platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Name, email address, phone number, and business information</li>
              <li>Client data you input into our CRM system</li>
              <li>Payment and billing information</li>
              <li>Communications with us and usage of our services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Device information and IP address</li>
              <li>Browser type and operating system</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Provide, maintain, and improve our services</li>
              <li>Send rate alerts and notifications</li>
              <li>Process payments and manage your account</li>
              <li>Communicate with you about updates and support</li>
              <li>Analyze usage patterns and optimize performance</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures to protect your information, including SSL encryption, secure data centers, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your data at any time by contacting us at privacy@ratemonitorpro.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              We use trusted third-party services for payment processing (Stripe), analytics (Google Analytics), and infrastructure (AWS). These services have their own privacy policies and we encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Access and review your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about this Privacy Policy, please contact us at:
              <br />
              <strong>Email:</strong> privacy@ratemonitorpro.com
              <br />
              <strong>Phone:</strong> (800) 555-1234
            </p>
          </section>
        </div>

        <TrustBadges />
      </div>
    </div>
  );
};

// Terms of Service Page
export const TermsOfServicePage: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">Last updated: October 8, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using Rate Monitor Pro, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Description</h2>
            <p className="text-gray-700 leading-relaxed">
              Rate Monitor Pro provides mortgage rate monitoring, CRM tools, AI-powered insights, and automated communication features for mortgage professionals. We reserve the right to modify, suspend, or discontinue any part of the service at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Responsibilities</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with applicable laws and regulations</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Use the service for any illegal purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Share your account with unauthorized parties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Subscription and Payment</h2>
            <p className="text-gray-700 leading-relaxed">
              Subscriptions are billed monthly at $97/month. You may cancel at any time with no penalty. Refunds are available within 30 days of your initial purchase. All fees are non-refundable after the 30-day period except as required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The service and its original content, features, and functionality are owned by Rate Monitor Pro and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Rate Monitor Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service. Our total liability shall not exceed the amount you paid us in the past 12 months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Disclaimer</h2>
            <p className="text-gray-700 leading-relaxed">
              The service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. Mortgage rates are provided for informational purposes only and should be verified before making business decisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Colorado, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these terms at any time. We will notify you of any changes by posting the new Terms of Service on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these Terms, contact us at:
              <br />
              <strong>Email:</strong> legal@ratemonitorpro.com
              <br />
              <strong>Phone:</strong> (800) 555-1234
            </p>
          </section>
        </div>

        <TrustBadges />
      </div>
    </div>
  );
};

// Cookie Policy Page
export const CookiePolicyPage: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Cookie className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Cookie Policy</h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">Last updated: October 8, 2025</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Cookies</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Essential Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Required for the service to function properly. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Authentication and security</li>
              <li>Session management</li>
              <li>Load balancing</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Help us understand how visitors interact with our service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
              <li>Page views and navigation patterns</li>
              <li>Feature usage statistics</li>
              <li>Performance monitoring</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">Functional Cookies</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Enable enhanced functionality and personalization:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Language preferences</li>
              <li>User interface customization</li>
              <li>Recent searches and filters</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We may use third-party services that set cookies for analytics and payment processing. These include Google Analytics, Stripe, and other essential service providers. These third parties have their own privacy policies.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Managing Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You can control cookies through your browser settings. However, disabling certain cookies may limit your ability to use some features of our service. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>View what cookies are stored</li>
              <li>Delete cookies individually or all at once</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Accept all cookies or be notified when a cookie is set</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookie Duration</h2>
            <p className="text-gray-700 leading-relaxed">
              Session cookies are deleted when you close your browser. Persistent cookies remain on your device for a set period or until you delete them. Most of our cookies are session-based for security purposes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Cookie Policy from time to time. We will notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about our use of cookies, please contact us at:
              <br />
              <strong>Email:</strong> privacy@ratemonitorpro.com
              <br />
              <strong>Phone:</strong> (800) 555-1234
            </p>
          </section>
        </div>

        <TrustBadges />
      </div>
    </div>
  );
};

// Compliance Page
export const CompliancePage: React.FC<LegalPageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm p-8 lg:p-12">
          <div className="flex items-center gap-3 mb-8">
            <Scale className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Compliance & Security</h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">Our commitment to security and regulatory compliance</p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Security Standards</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Rate Monitor Pro maintains the highest security standards to protect your data and ensure business continuity:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🔒</div>
                  <h3 className="text-lg font-semibold text-gray-900">SOC 2 Type II</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Independently audited for security, availability, and confidentiality controls
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🛡️</div>
                  <h3 className="text-lg font-semibold text-gray-900">256-bit SSL/TLS</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Bank-level encryption for all data in transit and at rest
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">🇪🇺</div>
                  <h3 className="text-lg font-semibold text-gray-900">GDPR Compliant</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Full compliance with EU data protection regulations
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">⚡</div>
                  <h3 className="text-lg font-semibold text-gray-900">99.9% Uptime SLA</h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Redundant infrastructure with automatic failover
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Protection</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>End-to-end encryption for all sensitive data</li>
              <li>Regular third-party security audits and penetration testing</li>
              <li>Automated backups with point-in-time recovery</li>
              <li>Multi-factor authentication (MFA) available</li>
              <li>Role-based access controls</li>
              <li>Data residency options for compliance requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Industry Compliance</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We understand the regulatory requirements of the mortgage industry:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>GLBA (Gramm-Leach-Bliley Act) compliant data handling</li>
              <li>TCPA (Telephone Consumer Protection Act) compliant calling features</li>
              <li>CAN-SPAM Act compliant email communications</li>
              <li>State and federal lending regulation awareness</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Incident Response</h2>
            <p className="text-gray-700 leading-relaxed">
              We maintain a comprehensive incident response plan with 24/7 monitoring, immediate notification protocols, and rapid remediation procedures. Our security team is always vigilant to protect your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Third-Party Vendors</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We only work with trusted, compliant vendors:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Amazon Web Services (AWS) for infrastructure</li>
              <li>Stripe for PCI-compliant payment processing</li>
              <li>All vendors undergo security reviews</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Certifications & Audits</h2>
            <p className="text-gray-700 leading-relaxed">
              We undergo regular third-party audits and maintain active certifications. Security reports and certifications are available upon request for enterprise customers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions?</h2>
            <p className="text-gray-700 leading-relaxed">
              For security or compliance questions, contact our security team:
              <br />
              <strong>Email:</strong> security@ratemonitorpro.com
              <br />
              <strong>Phone:</strong> (800) 555-1234
            </p>
          </section>
        </div>

        <TrustBadges />
      </div>
    </div>
  );
};

// Shared Trust Badges Component
const TrustBadges = () => (
  <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
      <div className="text-2xl mb-2">🔒</div>
      <div className="text-sm font-medium text-gray-900">SOC 2</div>
      <div className="text-xs text-gray-600">Compliant</div>
    </div>
    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
      <div className="text-2xl mb-2">🇪🇺</div>
      <div className="text-sm font-medium text-gray-900">GDPR</div>
      <div className="text-xs text-gray-600">Ready</div>
    </div>
    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
      <div className="text-2xl mb-2">🛡️</div>
      <div className="text-sm font-medium text-gray-900">SSL</div>
      <div className="text-xs text-gray-600">Encrypted</div>
    </div>
    <div className="bg-white rounded-lg p-4 text-center shadow-sm">
      <div className="text-2xl mb-2">⚡</div>
      <div className="text-sm font-medium text-gray-900">99.9%</div>
      <div className="text-xs text-gray-600">Uptime</div>
    </div>
  </div>
);