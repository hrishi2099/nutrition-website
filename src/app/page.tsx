import Link from 'next/link';
import PageTransition from '@/components/PageTransition';
import FadeInSection from '@/components/FadeInSection';
import AnimatedCard from '@/components/AnimatedCard';

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen">
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your Health with
              <span className="text-black"> Personalized Nutrition</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover the power of customized diet plans, expert guidance, and sustainable lifestyle changes 
              that fit your unique needs and goals.
            </p>
            <FadeInSection delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/diet-plan"
                className="bg-black text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Get Your Diet Plan
              </Link>
              <Link
                href="/about"
                className="border border-black text-black px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Learn More
              </Link>
            </FadeInSection>
          </FadeInSection>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose NutriSap?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our evidence-based approach combines nutrition science with personalized care to help you achieve lasting results.
            </p>
          </FadeInSection>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedCard delay={0.1} className="text-center p-6 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Personalized Plans</h3>
              <p className="text-gray-600">
                Custom nutrition plans tailored to your lifestyle, preferences, and health goals.
              </p>
            </AnimatedCard>
            
            <AnimatedCard delay={0.2} className="text-center p-6 rounded-lg bg-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">👨‍⚕️</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Expert Guidance</h3>
              <p className="text-gray-600">
                Work with certified nutritionists and dietitians who understand your unique needs.
              </p>
            </AnimatedCard>
            
            <AnimatedCard delay={0.3} className="text-center p-6 rounded-lg bg-gray-50 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Track Progress</h3>
              <p className="text-gray-600">
                Monitor your journey with easy-to-use tools and regular check-ins with our team.
              </p>
            </AnimatedCard>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Start Your Wellness Journey Today
              </h2>
              <p className="text-gray-600 mb-6">
                Whether you&apos;re looking to lose weight, gain muscle, manage a health condition, 
                or simply eat better, our comprehensive approach will guide you every step of the way.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span>
                  <span className="text-gray-900">Customized meal plans and recipes</span>
                </li>
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span>
                  <span className="text-gray-900">Nutritional education and support</span>
                </li>
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span>
                  <span className="text-gray-900">Regular progress monitoring</span>
                </li>
                <li className="flex items-center">
                  <span className="text-black mr-2">✓</span>
                  <span className="text-gray-900">24/7 access to our nutrition platform</span>
                </li>
              </ul>
              <Link
                href="/contact"
                className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors inline-block"
              >
                Get Started Now
              </Link>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Ready to Begin?</h3>
              <div className="space-y-4">
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-4">1️⃣</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Free Consultation</h4>
                    <p className="text-gray-600">Schedule your initial assessment</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-100 rounded-lg">
                  <span className="text-2xl mr-4">2️⃣</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Custom Plan</h4>
                    <p className="text-gray-600">Receive your personalized nutrition plan</p>
                  </div>
                </div>
                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-2xl mr-4">3️⃣</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">Achieve Goals</h4>
                    <p className="text-gray-600">Transform your health with ongoing support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>
    </PageTransition>
  );
}