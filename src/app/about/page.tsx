import PageTransition from '@/components/PageTransition';
import AnimatedCard from '@/components/AnimatedCard';

export default function About() {
  return (
    <PageTransition>
      <div className="min-h-screen">
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              About <span className="text-black">NutriSap</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&apos;re passionate about helping you achieve optimal health through evidence-based nutrition 
              and personalized wellness strategies.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 mb-6">
                At NutriSap, we believe that proper nutrition is the foundation of a healthy, fulfilling life. 
                Our mission is to make personalized nutrition accessible, understandable, and sustainable for everyone.
              </p>
              <p className="text-gray-600 mb-6">
                We combine cutting-edge nutritional science with practical, real-world application to help our 
                clients achieve their health goals and maintain them for life.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">500+</div>
                  <div className="text-gray-600">Happy Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-black">5+</div>
                  <div className="text-gray-600">Years Experience</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">What We Offer</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Personalized Nutrition Plans</h4>
                    <p className="text-gray-600">Custom meal plans based on your goals, preferences, and lifestyle</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Expert Consultations</h4>
                    <p className="text-gray-600">One-on-one sessions with certified nutritionists and dietitians</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Ongoing Support</h4>
                    <p className="text-gray-600">Continuous guidance and adjustments to ensure your success</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-black mr-3 mt-1">✓</span>
                  <div>
                    <h4 className="font-semibold">Educational Resources</h4>
                    <p className="text-gray-600">Access to workshops, guides, and nutritional education materials</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our team of certified nutritionists and wellness experts are here to guide you on your health journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <AnimatedCard delay={0.1} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👩‍⚕️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Dr. Sarah Johnson</h3>
              <p className="text-gray-600 mb-3">Lead Nutritionist</p>
              <p className="text-gray-600 text-sm">
                Ph.D. in Nutritional Science with 10+ years of experience in clinical nutrition and wellness coaching.
              </p>
            </AnimatedCard>
            
            <AnimatedCard delay={0.2} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Michael Chen</h3>
              <p className="text-gray-600 mb-3">Sports Nutritionist</p>
              <p className="text-gray-600 text-sm">
                Registered Dietitian specializing in athletic performance and sports nutrition for optimal results.
              </p>
            </AnimatedCard>
            
            <AnimatedCard delay={0.3} className="bg-white p-6 rounded-lg shadow-md text-center hover:shadow-lg transition-shadow">
              <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">👩‍🔬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Emily Rodriguez</h3>
              <p className="text-gray-600 mb-3">Wellness Coach</p>
              <p className="text-gray-600 text-sm">
                Certified Wellness Coach focused on sustainable lifestyle changes and behavioral nutrition.
              </p>
            </AnimatedCard>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Approach</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We believe in a holistic approach to nutrition that considers your entire lifestyle, not just what you eat.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔬</div>
              <h3 className="text-lg font-semibold mb-3">Science-Based</h3>
              <p className="text-gray-600 text-sm">
                All our recommendations are backed by the latest nutritional research and evidence.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-3">Personalized</h3>
              <p className="text-gray-600 text-sm">
                Every plan is tailored to your unique needs, preferences, and health goals.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🌱</div>
              <h3 className="text-lg font-semibold mb-3">Sustainable</h3>
              <p className="text-gray-600 text-sm">
                We focus on long-term lifestyle changes rather than quick fixes or fad diets.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-lg font-semibold mb-3">Supportive</h3>
              <p className="text-gray-600 text-sm">
                Our team provides ongoing support and motivation throughout your journey.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </PageTransition>
  );
}