#!/usr/bin/env node

/**
 * Test RAG System
 *
 * This script tests the RAG system with sample data to ensure it's working properly
 */

const fetch = require('node-fetch').default || require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testRAGSystem() {
  console.log('🧪 Testing RAG System...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connection...');
    const healthCheck = await fetch(`${BASE_URL}/api/health`);
    if (!healthCheck.ok) {
      console.log('❌ Server is not running. Please start with: npm run dev');
      return;
    }
    console.log('✅ Server is running\n');

    // Test 2: Test basic chatbot endpoint
    console.log('2. Testing basic chatbot...');
    const basicChatResponse = await fetch(`${BASE_URL}/api/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, what can you tell me about protein?',
        sessionId: 'test-session-' + Date.now()
      })
    });

    if (basicChatResponse.ok) {
      const basicChatData = await basicChatResponse.json();
      console.log('✅ Basic chatbot responded');
      console.log('Response preview:', basicChatData.response.substring(0, 100) + '...\n');
    } else {
      console.log('❌ Basic chatbot failed');
      const errorText = await basicChatResponse.text();
      console.log('Error:', errorText.substring(0, 200) + '...\n');
    }

    // Test 3: Test RAG-enhanced chatbot
    console.log('3. Testing RAG-enhanced chatbot...');
    const ragChatResponse = await fetch(`${BASE_URL}/api/chatbot/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What are the benefits of omega-3 fatty acids?',
        sessionId: 'test-rag-session-' + Date.now()
      })
    });

    if (ragChatResponse.ok) {
      const ragChatData = await ragChatResponse.json();
      console.log('✅ RAG chatbot responded');
      console.log('Response preview:', ragChatData.response.substring(0, 100) + '...');
      console.log('Metadata:', {
        ragUsed: ragChatData.metadata?.ragUsed,
        confidence: ragChatData.metadata?.confidence,
        searchTime: ragChatData.metadata?.searchTime + 'ms',
        documentsFound: ragChatData.metadata?.documentsFound,
        responseMethod: ragChatData.metadata?.responseMethod
      });
      console.log('');
    } else {
      console.log('❌ RAG chatbot failed');
      const errorText = await ragChatResponse.text();
      console.log('Error:', errorText.substring(0, 200) + '...\n');
    }

    // Test 4: Test different query types
    console.log('4. Testing different query types...');

    const testQueries = [
      'How many calories should I eat per day?',
      'What are good sources of protein?',
      'Can you recommend a healthy breakfast recipe?',
      'What supplements should I take?',
      'How do I calculate my BMI?'
    ];

    for (const query of testQueries) {
      console.log(`Testing: "${query}"`);

      const response = await fetch(`${BASE_URL}/api/chatbot/rag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          sessionId: 'test-queries-' + Date.now()
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`  ✅ Response length: ${data.response.length} chars, RAG used: ${data.metadata?.ragUsed || false}`);
      } else {
        console.log(`  ❌ Failed`);
      }
    }

    console.log('\n📋 Test Summary:');
    console.log('- If RAG is working, you should see "ragUsed: true" and search times');
    console.log('- If ChromaDB is not available, the system falls back to in-memory storage');
    console.log('- The chatbot should provide relevant nutrition information');
    console.log('- Response times should be reasonable (< 5 seconds)');

    console.log('\n💡 Next Steps:');
    console.log('1. If all tests pass, your RAG system is working!');
    console.log('2. To improve responses, populate with more knowledge:');
    console.log('   - Log in as admin and use the RAG management interface');
    console.log('   - Or use POST /api/admin/rag/ingest with {"type": "full"}');
    console.log('3. For better embeddings, set up HuggingFace API key');
    console.log('4. For production, consider setting up ChromaDB');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Make sure the server is running: npm run dev');
    console.log('- Check if the database is connected');
    console.log('- Verify that all dependencies are installed: npm install');
  }
}

if (require.main === module) {
  testRAGSystem();
}