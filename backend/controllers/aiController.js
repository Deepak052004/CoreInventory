import Product from '../models/Product.js';
import SalesOrder from '../models/SalesOrder.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Category from '../models/Category.js';

export const chatWithAi = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array is required.' });
    }

    // Gather basic system context from MongoDB to ground the AI
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({
      $expr: { $gt: ['$reorderLevel', '$stockQuantity'] },
      stockQuantity: { $gt: 0 }
    });
    const pendingSales = await SalesOrder.countDocuments({ status: { $in: ['draft', 'confirmed'] } });
    const pendingPurchases = await PurchaseOrder.countDocuments({ status: { $in: ['draft', 'submitted', 'approved'] } });

    const systemPrompt = {
      role: 'system',
      content: `You are CoreInventory AI, an intelligent, helpful, and concise inventory management assistant.
You are interacting with a user logged into the CoreInventory platform.
The user is asking questions about their inventory, data, or how to use the system.
Be very concise, professional, and helpful. Format your responses using markdown where appropriate.

CURRENT INVENTORY CONTEXT:
- Total Products in Catalog: ${totalProducts}
- Products currently Low on Stock: ${lowStockProducts}
- Pending Sales Orders (To be shipped): ${pendingSales}
- Pending Purchase Orders (Waiting for stock): ${pendingPurchases}

If the user asks a specific question about an item not in this context, politely inform them that you are currently a high-level assistant and they should search the Products page for specific item details.
If the user asks to add, create, or insert a product, YOU MUST use the 'create_product' tool. DO NOT hallucinate or pretend to create it in text.
If a tool operation fails, ALWAYS tell the user exactly why it failed.`
    };

    const tools = [
      {
        type: 'function',
        function: {
          name: 'create_product',
          description: 'Create a new product in the inventory. Use this when the user asks to add or create a product.',
          parameters: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'The name of the product' },
              SKU: { type: 'string', description: 'The unique SKU or barcode of the product' },
              categoryName: { type: 'string', description: 'The name of the category this product belongs to' },
              costPrice: { type: 'number', description: 'The cost price of the product' },
              sellingPrice: { type: 'number', description: 'The selling price of the product' }
            },
            required: ['name', 'SKU', 'categoryName']
          }
        }
      }
    ];

    const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    
    // Keep only the last 3 messages to prevent the LLM from getting stuck in a hallucination loop
    const recentMessages = messages.slice(-3);
    
    const ollamaPayload = {
      model: 'llama3.2',
      messages: [systemPrompt, ...recentMessages],
      tools: tools,
      stream: false,
    };
    
    console.log('[AI TOOL DEBUG] Sending payload to Ollama:', JSON.stringify(ollamaPayload, null, 2));

    // First request to Ollama
    let response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ollamaPayload),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status ${response.status}`);
    }

    let data = await response.json();
    console.log('[AI TOOL DEBUG] Received response from Ollama:', JSON.stringify(data, null, 2));
    let aiResponse = data.message;

    // Check if Ollama wants to use a tool
    if (aiResponse.tool_calls && aiResponse.tool_calls.length > 0) {
      // Append the assistant's tool call intent to the history
      messages.push(aiResponse);

      // Execute each tool
      for (const toolCall of aiResponse.tool_calls) {
        if (toolCall.function.name === 'create_product') {
          try {
            const args = toolCall.function.arguments;
            
            // Manual validation because small LLMs sometimes pass empty strings for required fields
            if (!args.name || !args.SKU || !args.categoryName) {
              messages.push({
                role: 'tool',
                content: 'Failed: You must ask the user to provide a Name, SKU, and Category name. Do not invent them yourself.',
                name: 'create_product'
              });
              continue; // Skip database logic
            }
            
            // 1. Find or create the category
            console.log('[AI TOOL] Looking for category:', args.categoryName);
            let category = await Category.findOne({ name: { $regex: new RegExp(`^${args.categoryName}$`, 'i') } });
            if (!category) {
              category = await Category.create({ name: args.categoryName, description: 'Auto-created by AI' });
              console.log('[AI TOOL] Created new category:', category._id);
            } else {
              console.log('[AI TOOL] Found existing category:', category._id);
            }

            // 2. Create the product
            console.log('[AI TOOL] Creating product with args:', args);
            const newProduct = await Product.create({
              name: args.name,
              SKU: args.SKU,
              category: category._id,
              costPrice: args.costPrice || 0,
              sellingPrice: args.sellingPrice || 0
            });
            console.log('[AI TOOL] Successfully created product:', newProduct._id);

            // 3. Inform the AI of success
            messages.push({
              role: 'tool',
              content: `Success! Created product ID: ${newProduct._id}.`,
              name: 'create_product' // Not supported by all models but good practice
            });

          } catch (err) {
            console.error('Tool execution error:', err);
            messages.push({
              role: 'tool',
              content: `Failed to create product due to database error: ${err.message}. Tell the user the operation failed.`,
              name: 'create_product'
            });
          }
        }
      }

      // Second request to Ollama to generate final response
      response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [systemPrompt, ...messages],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API responded with status ${response.status}`);
      }

      data = await response.json();
      aiResponse = data.message;
    }

    return res.json({
      success: true,
      message: aiResponse.content,
      role: aiResponse.role
    });

    } catch (err) {
      console.error('AI Controller error:', err);
      
      // If it's a fetch error to Ollama, give a friendly message
      if (err.cause?.code === 'ECONNREFUSED' || err.message.includes('fetch')) {
        return res.status(503).json({ 
          success: false, 
          message: 'Could not connect to local Ollama instance. Make sure Ollama is installed, running, and the "llama3.2" model is pulled.' 
        });
      }

      next(err);
    }
};
