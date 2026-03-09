import 'https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid request body. 'messages' array is required.");
    }

    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAiKey) {
      throw new Error('OPENAI_API_KEY is not set in the environment.');
    }

    // Initialize Supabase client
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const systemMessage = {
      role: 'system',
      content: `You are TacBot, an advanced AI Logistics Assistant for TAC (The Absolute Connections). 
Your domain includes shipment tracking, logistical inquiries, and general customer support.
You are professional, concise, and helpful. You do not hallucinate tracking numbers.
If a user asks to track a shipment, you must use the 'get_tracking_info' tool provided to look it up using their CN Number (e.g., TAC-12345).
If they don't provide a CN number, ask for it.
Respond using Markdown formatting. Maintain a highly polished and professional avant-garde tone.`,
    };

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_tracking_info',
          description:
            'Get real-time tracking events and status for a shipment using its Consignment Note (CN) Number. Returns the shipment details and all tracking events.',
          parameters: {
            type: 'object',
            properties: {
              cn_number: {
                type: 'string',
                description: 'The Consignment Note (CN) Number (e.g., TAC-2024-0001)',
              },
            },
            required: ['cn_number'],
          },
        },
      },
    ];

    const currentMessages = [systemMessage, ...messages];

    // Check if it's an OpenRouter key to handle base URL
    const isOpenRouter = openAiKey.startsWith('sk-or-');
    const baseURL = isOpenRouter
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    const model = isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4-turbo';

    // First LLM Call
    const response = await fetch(baseURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
        ...(isOpenRouter && { 'HTTP-Referer': 'https://tac-portal.demo', 'X-Title': 'TAC Portal' }),
      },
      body: JSON.stringify({
        model: model,
        messages: currentMessages,
        tools: tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('LLM Error:', err);
      throw new Error(`LLM Error: ${response.status}`);
    }

    const data = await response.json();
    const responseMessage = data.choices[0].message;

    // Check if the LLM wanted to call a tool
    if (responseMessage.tool_calls) {
      currentMessages.push(responseMessage); // Add the assistant's tool call request to history

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.function.name === 'get_tracking_info') {
          const args = JSON.parse(toolCall.function.arguments);
          const cnNumber = args.cn_number;

          console.log(`[TacBot] Tool execution: get_tracking_info for CN: ${cnNumber}`);

          // Securely query public tracking info. Public uses single to prevent leaking
          // We limit to 1 so we don't throw 406.
          const { data: shipment, error } = await supabase
            .from('public_shipment_tracking')
            .select('*')
            .eq('cn_number', cnNumber)
            .limit(1)
            .maybeSingle();

          let toolResult = '';
          if (error) {
            console.error('Tracking Error:', error);
            toolResult = 'Error looking up tracking information.';
          } else if (!shipment) {
            toolResult = `No tracking information found for CN Number: ${cnNumber}. Please check the number and try again.`;
          } else {
            // Fetch events associated with this tracking number
            const { data: events } = await supabase
              .from('public_tracking_events')
              .select('*')
              .eq('cn_number', cnNumber)
              .order('created_at', { ascending: false });

            toolResult = JSON.stringify({
              shipment_details: shipment,
              recent_events: events || [],
            });
          }

          // Append tool response
          currentMessages.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: 'get_tracking_info',
            content: toolResult,
          });
        }
      }

      // Second LLM Call with Tool Results
      const finalResponse = await fetch(baseURL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
          ...(isOpenRouter && {
            'HTTP-Referer': 'https://tac-portal.demo',
            'X-Title': 'TAC Portal',
          }),
        },
        body: JSON.stringify({
          model: model,
          messages: currentMessages,
        }),
      });

      const finalData = await finalResponse.json();
      return new Response(JSON.stringify(finalData.choices[0].message), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normal response (no tools called)
    return new Response(JSON.stringify(responseMessage), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Function errored:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
