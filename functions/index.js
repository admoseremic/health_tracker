/**
 * Cloud Functions for Health Tracker
 *
 * This file contains Firebase Cloud Functions for the Health Tracker app.
 * Primary function: estimateCalories - uses Claude AI to estimate calories from food descriptions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function: estimateCalories
 *
 * Accepts a food description and returns calorie estimate using Claude AI
 *
 * Request body: { foodDescription: string }
 * Response: {
 *   calories: number,
 *   description: string,
 *   breakdown: { protein: number, carbs: number, fat: number },
 *   confidence: string,
 *   items: array
 * }
 */
exports.estimateCalories = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    if (!data.foodDescription || typeof data.foodDescription !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Food description is required and must be a string'
      );
    }

    const foodDescription = data.foodDescription.trim();

    if (foodDescription.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Food description cannot be empty'
      );
    }

    // Get Claude API key from environment config
    const apiKey = functions.config().claude?.api_key;

    if (!apiKey) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Claude API key not configured'
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Construct prompt for Claude
    const prompt = `You are a nutrition expert. Analyze the following food description and provide a detailed calorie estimate.

Food description: "${foodDescription}"

Important guidelines:
- If portion sizes are not specified, assume standard/typical portions
- Be realistic and conservative with estimates
- If the description is vague, make reasonable assumptions
- Consider typical preparation methods (e.g., grilled, fried, baked)

Return your response in this exact JSON format (valid JSON only, no markdown):
{
  "calories": <total calories as a number>,
  "confidence": "<low, medium, or high>",
  "breakdown": {
    "protein": <grams of protein>,
    "carbs": <grams of carbohydrates>,
    "fat": <grams of fat>
  },
  "description": "<normalized description with estimated portion sizes>",
  "items": [
    {"item": "<food item with portion>", "calories": <calories for this item>}
  ]
}`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // Parse Claude's response
    const responseText = message.content[0].text;
    console.log('Claude response:', responseText);

    // Extract JSON from response (in case Claude wraps it in markdown)
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate response structure
    if (!result.calories || typeof result.calories !== 'number') {
      throw new Error('Invalid response format from Claude');
    }

    // Return the structured result
    return {
      success: true,
      data: {
        calories: Math.round(result.calories),
        description: result.description || foodDescription,
        breakdown: result.breakdown || { protein: 0, carbs: 0, fat: 0 },
        confidence: result.confidence || 'medium',
        items: result.items || []
      }
    };

  } catch (error) {
    console.error('Error in estimateCalories:', error);

    // Handle different types of errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to estimate calories: ' + error.message
    );
  }
});

/**
 * Optional: Helper function to aggregate daily calorie totals
 * Can be used for analytics or daily summaries
 */
exports.aggregateDailyCalories = functions.firestore
  .document('foodLog/{entryId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const date = data.date;

    // You could update a dailySummary collection here if needed
    console.log(`New food entry for ${date}: ${data.calories} calories`);

    return null;
  });
