#!/usr/bin/env node

/**
 * Direct Knowledge Population
 *
 * This script directly populates the RAG system using the API endpoint
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function populateKnowledge() {
  console.log('🚀 Populating Knowledge Base Directly...\n');

  try {
    // Test server connection
    console.log('1. Testing server connection...');
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (!healthCheck.ok) {
      console.log('❌ Server is not running. Please start with: npm run dev');
      return;
    }
    console.log('✅ Server is running\n');

    // Populate knowledge base
    console.log('2. Populating knowledge base...');
    const populateResponse = await fetch(`${BASE_URL}/api/populate-knowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (populateResponse.ok) {
      const result = await populateResponse.json();
      console.log('✅ Knowledge base populated successfully!');
      console.log(`📊 Documents added: ${result.stats.documentsAdded}/${result.stats.totalAttempted}`);
      console.log(`📚 Total in collection: ${result.stats.totalInCollection}`);

      if (result.stats.errors > 0) {
        console.log(`⚠️  Errors: ${result.stats.errors}`);
        result.stats.errorDetails.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      const error = await populateResponse.text();
      console.log('❌ Failed to populate knowledge base:', error);
      return;
    }

    console.log('\n3. Testing enhanced RAG responses...');

    // Test queries with expected improvements
    const testQueries = [
      {
        query: 'What are good sources of protein?',
        expectation: 'Should mention specific protein amounts and food sources'
      },
      {
        query: 'Tell me about omega-3 benefits',
        expectation: 'Should mention heart health, brain function, inflammation'
      },
      {
        query: 'How much protein do I need daily?',
        expectation: 'Should mention 0.8-1.2 grams per kilogram'
      },
      {
        query: 'What are the benefits of salmon?',
        expectation: 'Should mention omega-3, protein content, and vitamin D'
      },
      {
        query: 'Can you recommend a healthy breakfast?',
        expectation: 'Should provide specific recipe with nutritional info'
      },
      {
        query: 'What supplements should I take?',
        expectation: 'Should mention vitamin D, B12, omega-3'
      }
    ];

    let ragSuccesses = 0;
    let improvedResponses = 0;

    for (const test of testQueries) {
      console.log(`\n🧪 Testing: "${test.query}"`);

      const response = await fetch(`${BASE_URL}/api/chatbot/rag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.query,
          sessionId: 'knowledge-test-' + Date.now()
        })
      });

      if (response.ok) {
        const data = await response.json();
        const ragUsed = data.metadata?.ragUsed;
        const responseMethod = data.metadata?.responseMethod;
        const docsFound = data.metadata?.documentsFound || 0;
        const confidence = data.metadata?.confidence || 0;

        console.log(`   📊 Method: ${responseMethod}, RAG: ${ragUsed}, Docs: ${docsFound}, Confidence: ${confidence}`);
        console.log(`   💬 Response: ${data.response.substring(0, 150)}...`);

        if (ragUsed) {
          ragSuccesses++;
        }

        // Check if response seems more detailed/specific
        if (data.response.length > 200 && (
          data.response.includes('gram') ||
          data.response.includes('calorie') ||
          data.response.includes('vitamin') ||
          data.response.includes('health')
        )) {
          improvedResponses++;
          console.log('   ✅ Response appears enhanced with specific nutritional information');
        }
      } else {
        console.log('   ❌ Query failed');
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📋 Test Results Summary:');
    console.log(`- RAG-powered responses: ${ragSuccesses}/${testQueries.length}`);
    console.log(`- Enhanced responses: ${improvedResponses}/${testQueries.length}`);

    if (ragSuccesses > 0) {
      console.log('\n🎉 SUCCESS! Your RAG system is now providing enhanced responses!');
      console.log('   The chatbot now has access to comprehensive nutrition knowledge.');
    } else if (improvedResponses > 0) {
      console.log('\n✅ IMPROVED! Responses are more detailed even without RAG activation.');
      console.log('   The system is working and may activate RAG for more specific queries.');
    } else {
      console.log('\n⚠️  The knowledge was added but RAG may need more time or specific triggers.');
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Visit http://localhost:3001 to interact with your enhanced chatbot');
    console.log('2. Try asking specific nutrition questions');
    console.log('3. The RAG system will activate for relevant nutrition queries');
    console.log('4. Ask about protein, omega-3, fiber, supplements, or specific foods');

  } catch (error) {
    console.error('❌ Population failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure the server is running: npm run dev');
    console.log('- Check if the RAG system is properly initialized');
    console.log('- Verify the knowledge population API is working');
  }
}

if (require.main === module) {
  populateKnowledge();
}