// Script to add BMI-related training data to the chatbot
// This should be run by an admin through the training interface

const BMI_TRAINING_DATA = [
  {
    intent: {
      name: "bmi_calculation_request",
      description: "User wants to calculate their BMI",
      category: "health_tools",
      priority: 8
    },
    examples: [
      { userInput: "Calculate my BMI", confidence: 1.0 },
      { userInput: "What is my BMI", confidence: 1.0 },
      { userInput: "Can you calculate BMI", confidence: 0.9 },
      { userInput: "Help me with BMI calculation", confidence: 0.9 },
      { userInput: "I want to know my body mass index", confidence: 0.8 },
      { userInput: "BMI calculator", confidence: 0.9 },
      { userInput: "Check my BMI", confidence: 0.9 }
    ],
    responses: [
      {
        response: "I'd be happy to help you calculate your BMI! To get an accurate calculation, I need your weight and height. You can tell me like: 'I weigh 70kg and I'm 175cm tall' or 'My weight is 150 lbs and height is 5'8\"'. Once calculated, I'll provide personalized nutrition recommendations based on your BMI category.",
        responseType: "text",
        priority: 10
      }
    ]
  },
  {
    intent: {
      name: "bmi_with_measurements",
      description: "User provides weight and height for BMI calculation",
      category: "health_tools", 
      priority: 9
    },
    examples: [
      { userInput: "I weigh 70kg and I'm 175cm tall", confidence: 1.0 },
      { userInput: "My weight is 150 lbs and height is 5'8\"", confidence: 1.0 },
      { userInput: "Calculate BMI for 65kg and 160cm", confidence: 1.0 },
      { userInput: "BMI for 180 lbs and 6 feet", confidence: 0.9 },
      { userInput: "I'm 170cm and weigh 60kg", confidence: 0.9 },
      { userInput: "Height 5'6\" weight 140 pounds", confidence: 0.8 }
    ],
    responses: [
      {
        response: "Perfect! Let me calculate your BMI using those measurements. {{bmi_calculation}} Based on your BMI category, here are personalized nutrition recommendations to support your health goals. Would you like specific meal suggestions or dietary guidance?",
        responseType: "template",
        priority: 10,
        variables: {
          bmi_calculation: "dynamic"
        }
      }
    ]
  },
  {
    intent: {
      name: "bmi_category_question",
      description: "User asks about BMI categories or what their BMI means",
      category: "health_education",
      priority: 7
    },
    examples: [
      { userInput: "What does my BMI mean", confidence: 1.0 },
      { userInput: "BMI categories", confidence: 0.9 },
      { userInput: "What is a good BMI", confidence: 0.9 },
      { userInput: "BMI ranges", confidence: 0.8 },
      { userInput: "Is my BMI normal", confidence: 0.9 },
      { userInput: "What BMI should I have", confidence: 0.8 }
    ],
    responses: [
      {
        response: "BMI (Body Mass Index) categories help assess if your weight is healthy for your height:\n\n🔵 Under 18.5: Underweight\n🟢 18.5-24.9: Normal weight (healthy range)\n🟡 25.0-29.9: Overweight\n🔴 30.0+: Obesity\n\nRemember, BMI is a general indicator and doesn't account for muscle mass or body composition. Athletes may have higher BMIs due to muscle weight. Would you like me to calculate your BMI?",
        responseType: "text",
        priority: 10
      }
    ]
  },
  {
    intent: {
      name: "weight_management_advice",
      description: "User asks for advice based on their BMI category",
      category: "nutrition_advice",
      priority: 8
    },
    examples: [
      { userInput: "How to lose weight based on BMI", confidence: 0.9 },
      { userInput: "Weight management tips", confidence: 0.8 },
      { userInput: "I'm overweight what should I eat", confidence: 0.9 },
      { userInput: "Nutrition advice for my BMI", confidence: 0.9 },
      { userInput: "Diet plan for weight loss", confidence: 0.8 },
      { userInput: "How to gain healthy weight", confidence: 0.8 }
    ],
    responses: [
      {
        response: "I'd love to provide personalized weight management advice! First, let me calculate your BMI to give you the most appropriate recommendations. Please tell me your weight and height, like: 'I weigh 70kg and I'm 175cm tall'. Based on your BMI category, I'll provide specific nutrition strategies and meal suggestions tailored to your goals.",
        responseType: "text",
        priority: 10
      }
    ]
  }
];

console.log('BMI Training Data Structure:');
console.log(JSON.stringify(BMI_TRAINING_DATA, null, 2));

// Instructions for adding this data:
console.log('\n=== INSTRUCTIONS FOR ADDING BMI TRAINING DATA ===');
console.log('1. Log in as admin to your NutriSap application');
console.log('2. Navigate to /admin/chatbot');
console.log('3. For each intent in the data above:');
console.log('   a. Click "Add New Intent"');
console.log('   b. Fill in the intent details (name, description, category, priority)');
console.log('   c. Save the intent');
console.log('   d. Click on the intent to add examples and responses');
console.log('   e. Add all the examples and responses listed');
console.log('4. Test the training using /admin/chatbot/analytics');
console.log('5. Try queries like "Calculate my BMI" or "I weigh 70kg and I\'m 175cm"');

module.exports = BMI_TRAINING_DATA;