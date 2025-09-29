#!/usr/bin/env node

/**
 * RAG Setup Script
 *
 * This script helps set up the RAG (Retrieval-Augmented Generation) system
 * for the nutrition chatbot. It can:
 *
 * 1. Check if ChromaDB is running
 * 2. Initialize the knowledge base
 * 3. Populate with existing nutrition data
 * 4. Test the RAG functionality
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROMA_DEFAULT_PORT = 8000;
const CHROMA_DEFAULT_HOST = 'localhost';

async function checkChromaDB() {
  console.log('🔍 Checking ChromaDB status...');

  return new Promise((resolve) => {
    exec(`curl -s http://${CHROMA_DEFAULT_HOST}:${CHROMA_DEFAULT_PORT}/api/v1/heartbeat`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ ChromaDB is not running');
        console.log('💡 To start ChromaDB:');
        console.log('   Option 1: Docker - docker run -p 8000:8000 chromadb/chroma');
        console.log('   Option 2: Python - pip install chromadb && chroma run --host 0.0.0.0 --port 8000');
        resolve(false);
      } else {
        console.log('✅ ChromaDB is running');
        resolve(true);
      }
    });
  });
}

async function checkEnvironment() {
  console.log('🔍 Checking environment configuration...');

  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.rag.example');

  if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env.local file not found');

    if (fs.existsSync(envExamplePath)) {
      console.log('💡 You can copy RAG settings from .env.rag.example to .env.local');
    }

    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check for HuggingFace API key
  if (envContent.includes('HUGGINGFACE_API_KEY=') && !envContent.includes('HUGGINGFACE_API_KEY=""')) {
    console.log('✅ HuggingFace API key configured');
  } else {
    console.log('💡 No HuggingFace API key found - will use local embeddings');
  }

  return true;
}

async function testRAGEndpoint() {
  console.log('🧪 Testing RAG endpoint...');

  return new Promise((resolve) => {
    exec('curl -s -X GET http://localhost:3000/api/admin/rag/ingest', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Cannot reach RAG endpoint - make sure your Next.js server is running');
        console.log('💡 Run: npm run dev');
        resolve(false);
      } else {
        try {
          const response = JSON.parse(stdout);
          if (response.error && response.error.includes('Unauthorized')) {
            console.log('⚠️  RAG endpoint requires admin authentication');
            console.log('💡 Log in as admin first, then try again');
          } else {
            console.log('✅ RAG endpoint is accessible');
          }
          resolve(true);
        } catch {
          console.log('⚠️  RAG endpoint responded but with unexpected format');
          resolve(false);
        }
      }
    });
  });
}

async function main() {
  console.log('🚀 NutriSap RAG Setup Script\n');

  // Check if we're in the right directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ Please run this script from the project root directory');
    process.exit(1);
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (packageJson.name !== 'nutrisap-website') {
    console.log('❌ This doesn\'t appear to be the NutriSap project');
    process.exit(1);
  }

  console.log('✅ Project directory confirmed\n');

  // Run checks
  const chromaRunning = await checkChromaDB();
  const envConfigured = await checkEnvironment();
  const ragEndpointWorking = await testRAGEndpoint();

  console.log('\n📋 Setup Summary:');
  console.log(`ChromaDB Running: ${chromaRunning ? '✅' : '❌'}`);
  console.log(`Environment: ${envConfigured ? '✅' : '❌'}`);
  console.log(`RAG Endpoint: ${ragEndpointWorking ? '✅' : '⚠️'}`);

  console.log('\n📚 Next Steps:');

  if (!chromaRunning) {
    console.log('1. Start ChromaDB (see instructions above)');
  }

  if (!envConfigured) {
    console.log('2. Configure environment variables');
  }

  if (chromaRunning && envConfigured) {
    console.log('3. Initialize knowledge base:');
    console.log('   - Log in to admin panel at http://localhost:3000/admin');
    console.log('   - Navigate to RAG Management');
    console.log('   - Click "Initialize Knowledge Base"');
    console.log('   OR');
    console.log('   - Use API: POST /api/admin/rag/ingest with {"type": "full"}');
  }

  console.log('4. Test the chatbot at http://localhost:3000');

  console.log('\n🔧 Troubleshooting:');
  console.log('- If ChromaDB fails to start, try: pip install chromadb');
  console.log('- For permission issues, make sure you\'re logged in as admin');
  console.log('- Check browser console for any errors');
  console.log('- Verify database connection is working');

  console.log('\n✨ Once setup is complete, your chatbot will have:');
  console.log('- Enhanced responses using your nutrition database');
  console.log('- Personalized recommendations based on user context');
  console.log('- Fallback to multiple AI systems for comprehensive coverage');
  console.log('- Real-time learning from user interactions');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkChromaDB, checkEnvironment, testRAGEndpoint };