/**
 * Cloud Functions for Health Tracker
 *
 * This file contains Firebase Cloud Functions for the Health Tracker app.
 * Primary function: estimateCalories - uses Claude AI to estimate calories from food descriptions
 *
 * Deployment: Automated via GitHub Actions
 * APIs enabled: Cloud Functions, Cloud Build, Artifact Registry, Extensions, Cloud Billing
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors')({origin: true});

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Cloud Function: estimateCaloriesV2
 *
 * Accepts a food description and returns calorie estimate using Claude AI
 * Uses onRequest with CORS middleware for proper cross-origin support
 *
 * Request body: { data: { foodDescription: string } }
 * Response: { result: { ... } }
 */
exports.estimateCaloriesV2 = functions.https.onRequest((req, res) => {
  // Handle CORS
  return cors(req, res, async () => {
    try {
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      // Extract data from request body (Firebase callable format)
      const data = req.body.data || req.body;

      // Validate input
      if (!data.foodDescription || typeof data.foodDescription !== 'string') {
        res.status(400).json({
          error: {
            message: 'Food description is required and must be a string'
          }
        });
        return;
      }

      const foodDescription = data.foodDescription.trim();

      if (foodDescription.length === 0) {
        res.status(400).json({
          error: {
            message: 'Food description cannot be empty'
          }
        });
        return;
      }

      // Get Claude API key from environment config or environment variable
      // Supports both Firebase config (legacy) and GitHub Actions deployment
      const apiKey = process.env.CLAUDE_API_KEY || functions.config().claude?.api_key;

      if (!apiKey) {
        res.status(500).json({
          error: {
            message: 'Claude API key not configured'
          }
        });
        return;
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

      // Return the structured result in Firebase callable format
      res.status(200).json({
        result: {
          success: true,
          data: {
            calories: Math.round(result.calories),
            description: result.description || foodDescription,
            breakdown: result.breakdown || { protein: 0, carbs: 0, fat: 0 },
            confidence: result.confidence || 'medium',
            items: result.items || []
          }
        }
      });

    } catch (error) {
      console.error('Error in estimateCalories:', error);

      res.status(500).json({
        error: {
          message: 'Failed to estimate calories: ' + error.message
        }
      });
    }
  });
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
