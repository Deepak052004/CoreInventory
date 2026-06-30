import Product from '../models/Product.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Category from '../models/Category.js';
import { GoogleGenAI, Type } from '@google/genai';

export const chatWithAi = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ success: false, message: 'Gemini API key is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Gather basic system context from MongoDB to ground the AI
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $gt: ['$reorderLevel', '$stockQuantity'] },
      stockQuantity: { $gt: 0 }
    });
    const pendingSales = await SalesOrder.countDocuments({ status: { $in: ['draft', 'confirmed'] } });
    const pendingPurchases = await PurchaseOrder.countDocuments({ status: { $in: ['draft', 'submitted', 'approved'] } });

    const systemInstruction = `You are CoreInventory AI, an intelligent, helpful, and concise inventory management assistant.
You are interacting with a user logged into the CoreInventory platform.
The user is asking questions about their inventory, data, or how to use the system.
Be very concise, professional, and helpful. Format your responses using markdown where appropriate.

CURRENT INVENTORY CONTEXT:
- Total Products in Catalog: ${totalProducts}
- Products currently Low on Stock: ${lowStockProducts}
- Pending Sales Orders (To be shipped): ${pendingSales}
- Pending Purchase Orders (Waiting for stock): ${pendingPurchases}

If the user asks a specific question about an item not in this context, politely inform them that you are currently a high-level assistant and they should search the Products page for specific item details.
If the user asks to add, create, or insert a product, YOU MUST use the 'create_product' tool.
If a tool operation fails, ALWAYS tell the user exactly why it failed.`;

    const createProductTool = {
      functionDeclarations: [
        {
          name: 'create_product',
          description: 'Create a new product in the inventory. Use this when the user asks to add or create a product.',
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'The name of the product' },
              SKU: { type: Type.STRING, description: 'The unique SKU or barcode of the product' },
              categoryName: { type: Type.STRING, description: 'The name of the category this product belongs to' },
              costPrice: { type: Type.NUMBER, description: 'The cost price of the product' },
              sellingPrice: { type: Type.NUMBER, description: 'The selling price of the product' }
            },
            required: ['name', 'SKU', 'categoryName']
          }
        }
      ]
    };

    // Format history for Gemini (max last 3 to avoid hallucination loops)
    const recentMessages = messages.slice(-3).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

    console.log('[AI TOOL DEBUG] Sending payload to Gemini');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: recentMessages,
      config: {
        systemInstruction,
        tools: [createProductTool],
        temperature: 0.2, // Low temp for more reliable tool calls
      }
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === 'create_product') {
        try {
          const args = call.args;
          
          if (!args.name || !args.SKU || !args.categoryName) {
            return res.json({
              success: true,
              message: 'Failed: You must provide a Name, SKU, and Category name. Please ask again with all details.',
              role: 'assistant'
            });
          }
          
          console.log('[AI TOOL] Looking for category:', args.categoryName);
          let category = await Category.findOne({ name: { $regex: new RegExp(`^${args.categoryName}$`, 'i') } });
          if (!category) {
            category = await Category.create({ name: args.categoryName, description: 'Auto-created by AI' });
          }

          console.log('[AI TOOL] Creating product:', args);
          const newProduct = await Product.create({
            name: args.name,
            SKU: args.SKU,
            category: category._id,
            costPrice: args.costPrice || 0,
            sellingPrice: args.sellingPrice || 0
          });

          // Follow-up request to Gemini with the function result
          const followUp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              ...recentMessages,
              { role: 'model', parts: [{ functionCall: call }] },
              { role: 'user', parts: [{ functionResponse: { name: 'create_product', response: { success: true, productId: newProduct._id } } }] }
            ],
            config: { systemInstruction }
          });

          return res.json({
            success: true,
            message: followUp.text,
            role: 'assistant'
          });

        } catch (err) {
          console.error('Tool execution error:', err);
          return res.json({
            success: true,
            message: `Failed to create product due to database error: ${err.message}.`,
            role: 'assistant'
          });
        }
      }
    }

    return res.json({
      success: true,
      message: response.text,
      role: 'assistant'
    });

  } catch (err) {
    console.error('AI Controller error:', err);
    next(err);
  }
};
