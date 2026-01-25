import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { validateEnvironment } from '../_shared/env-validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // UTF-8 decoder
    const decoder = new TextDecoder('utf-8');

    // Validate environment variables
    const env = validateEnvironment();

    // Extract authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body with explicit UTF-8 decoding
    const bodyBytes = await req.arrayBuffer();
    const bodyText = decoder.decode(bodyBytes);
    const body = JSON.parse(bodyText);

    const {
      deck_id,
      refinement_prompt,
    } = body;

    // Enhanced input validation
    if (!deck_id || typeof deck_id !== 'string' || deck_id.trim().length === 0) {
      throw new Error('Deck ID is required and cannot be empty');
    }

    if (!refinement_prompt || typeof refinement_prompt !== 'string' || refinement_prompt.trim().length === 0) {
      throw new Error('Refinement prompt is required and cannot be empty');
    }

    if (refinement_prompt.length > 10000) {
      throw new Error('Refinement prompt too large (maximum 10KB)');
    }

    console.log('🔧 [DECK_REFINE] Starting deck refinement:', {
      deck_id,
      refinement_prompt_length: refinement_prompt.length,
    });

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid authentication token');
    }

    // 1. Fetch current deck data
    console.log('📄 [DECK_REFINE] Fetching current deck...');

    const { data: deckData, error: deckError } = await supabase
      .from('j_hub_decks')
      .select('*')
      .eq('id', deck_id)
      .single();

    if (deckError || !deckData) {
      throw new Error(`Deck not found: ${deckError?.message}`);
    }

    // Check permissions (user must own deck or be admin/staff)
    const { data: userData } = await supabase
      .from('j_hub_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const userRole = userData?.role || 'client';
    const canEdit = userRole === 'admin' || userRole === 'staff' || deckData.user_id === user.id;

    if (!canEdit) {
      throw new Error('You do not have permission to edit this deck');
    }

    console.log('✅ [DECK_REFINE] Permission granted:', userRole);

    // 2. Get next version number atomically (prevents race conditions)
    console.log('📊 [DECK_REFINE] Getting next version number with locking...');
    const { data: newVersionNumber, error: versionError } = await supabase
      .rpc('get_next_version_number', { p_deck_id: deck_id });

    if (versionError || !newVersionNumber) {
      console.error('❌ [DECK_REFINE] Failed to get version number:', versionError);
      throw new Error(`Failed to get version number: ${versionError?.message}`);
    }

    console.log('📊 [DECK_REFINE] New version number:', newVersionNumber);

    // 3. Get current HTML (to refine)
    const currentHtml = deckData.html_output;
    if (!currentHtml) {
      throw new Error('Deck has no HTML output to refine');
    }

    // 4. Get original markdown for context
    const originalMarkdown = deckData.markdown_source || '';

    // 5. Build Claude prompt for refinement
    const systemPrompt = `You are a professional presentation designer refining existing HTML presentations based on user feedback.

CRITICAL INSTRUCTIONS:

1. ⚠️ MANDATORY: You are REFINING an existing HTML presentation, NOT creating from scratch
   - The HTML structure and most slides should remain intact
   - Apply only the SPECIFIC changes requested by the user
   - Do NOT regenerate the entire presentation
   - Do NOT change slides that were not mentioned in the feedback

2. USER FEEDBACK FORMAT:
   - User will describe desired changes in natural language
   - Examples: "Make title bigger on slide 3", "Change background color to purple on cover slide"
   - Apply changes precisely as described
   - If feedback is ambiguous, make conservative changes

3. ASSET PATHS (CRITICAL - MUST REMAIN ABSOLUTE):
   ⚠️ MANDATORY: ALL asset URLs must remain as absolute HTTPS URLs (https://flow.jumper.studio/...)
   - DO NOT change any working asset paths
   - DO NOT convert absolute URLs to relative paths
   - Maintain all existing src and url() references exactly as they are
   - Only modify asset paths if user explicitly requests different assets

4. DATA FIDELITY (ZERO TOLERANCE FOR HALLUCINATION):
   - DO NOT add data that doesn't exist in the original HTML
   - DO NOT modify metrics, numbers, or text unless specifically requested
   - DO NOT invent new slides or content
   - Only apply the specific changes user requested

5. CSS & STYLING CHANGES:
   - Can modify: font-size, color, background-color, padding, margin, layout
   - Can add: new CSS classes or inline styles as needed
   - Must maintain: responsive design, animations, existing class structure

6. STRUCTURAL CHANGES:
   - Can reorder: slides if user requests different sequence
   - Can modify: specific slide content/layout if user requests
   - Cannot remove: slides unless explicitly requested
   - Cannot add: completely new slides unless explicitly requested

7. QUALITY STANDARDS:
   - Maintain professional appearance
   - Ensure all text remains readable
   - Preserve responsive behavior
   - Test mentally: "Did I apply ONLY what user asked for?"

8. OUTPUT:
   - Return the COMPLETE refined HTML (entire document)
   - Include all unchanged slides (user will see the whole presentation)
   - No markdown fences, no explanations
   - HTML must be production-ready

OUTPUT LANGUAGE: HTML with Brazilian Portuguese content (UTF-8 encoded)`;

    const userPrompt = `==============================================
CURRENT HTML PRESENTATION (TO BE REFINED)
==============================================
${currentHtml}

==============================================
ORIGINAL MARKDOWN (FOR CONTEXT ONLY)
==============================================
${originalMarkdown}

==============================================
USER'S REFINEMENT REQUEST
==============================================
${refinement_prompt}

==============================================
TASK
==============================================
Apply ONLY the specific changes requested by the user to the HTML presentation above.
Maintain all other aspects of the presentation unchanged.

OUTPUT FORMAT: Complete refined HTML file (no markdown fences, no explanations)`;

    console.log('🤖 [DECK_REFINE] Calling Claude Sonnet 4.5 for refinement...');
    console.log('📏 [DECK_REFINE] Current HTML length:', currentHtml.length, 'chars');
    console.log('📝 [DECK_REFINE] Refinement prompt:', refinement_prompt);

    // 6. Call Claude API to refine HTML
    const startTime = Date.now();
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json; charset=utf-8',
        'Accept': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 16000, // Large enough for complete HTML
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ [DECK_REFINE] Claude API error:', errorText);
      throw new Error(`Claude API error: ${claudeResponse.status}`);
    }

    // Force UTF-8 decoding of Claude response
    const claudeBytes = await claudeResponse.arrayBuffer();
    const claudeText = decoder.decode(claudeBytes);
    const claudeData = JSON.parse(claudeText);

    // Validate Claude API response structure
    if (!claudeData.content || !Array.isArray(claudeData.content) || claudeData.content.length === 0) {
      console.error('❌ [DECK_REFINE] Invalid Claude response structure:', claudeData);
      throw new Error('Invalid Claude API response: missing content array');
    }

    if (!claudeData.content[0] || !claudeData.content[0].text) {
      console.error('❌ [DECK_REFINE] Invalid Claude response structure:', claudeData.content[0]);
      throw new Error('Invalid Claude API response: missing text in content[0]');
    }

    let htmlRefined = claudeData.content[0].text.trim();

    // Sanity check: HTML should not be empty or suspiciously short
    if (htmlRefined.length < 100) {
      console.error('❌ [DECK_REFINE] Claude returned suspiciously short HTML:', htmlRefined.length, 'chars');
      throw new Error('Claude returned suspiciously short HTML output (less than 100 characters)');
    }
    const latency = Date.now() - startTime;

    // Clean up markdown fences if Claude included them
    htmlRefined = htmlRefined.replace(/^```html\n/, '').replace(/\n```$/, '').trim();

    console.log('✅ [DECK_REFINE] HTML refined');
    console.log('📏 [DECK_REFINE] Refined HTML length:', htmlRefined.length, 'chars');
    console.log('⏱️ [DECK_REFINE] Latency:', latency, 'ms');
    console.log('🎫 [DECK_REFINE] Tokens used:', (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0));

    // 7. Validate: Check for relative paths in refined HTML
    console.log('🔍 [DECK_REFINE] Validating asset paths...');

    const relativePathPatterns = [
      /url\(['"]\/decks\//gi,
      /url\(['"]\.\.?\//gi,
      /src=['"]\/decks\//gi,
      /src=['"]\.\.?\//gi,
    ];

    let hasRelativePaths = false;
    const relativePathExamples: string[] = [];

    relativePathPatterns.forEach(pattern => {
      const matches = htmlRefined.match(pattern);
      if (matches) {
        hasRelativePaths = true;
        relativePathExamples.push(...matches.slice(0, 3));
      }
    });

    if (hasRelativePaths) {
      console.error('❌ [DECK_REFINE] VALIDATION FAILED: Relative paths detected:', relativePathExamples);
      throw new Error(`Refined HTML contains relative paths. Examples: ${relativePathExamples.join(', ')}`);
    }

    console.log('✅ [DECK_REFINE] Validation passed: All paths are absolute');

    // 8. Generate changes summary (ask Claude to summarize)
    console.log('📝 [DECK_REFINE] Generating changes summary...');

    const summaryResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5-20251101',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Based on this user feedback:\n\n"${refinement_prompt}"\n\nWrite a brief summary (1-2 sentences) of what changes were applied to the presentation. Be specific but concise.`
        }],
      }),
    });

    let changesSummary = 'Refinamento aplicado com sucesso';

    if (summaryResponse.ok) {
      const summaryData = await summaryResponse.json();
      changesSummary = summaryData.content[0].text.trim();
    }

    console.log('✅ [DECK_REFINE] Changes summary:', changesSummary);

    // 9. Upload refined HTML to Supabase Storage
    const fileName = `${user.id}/${deck_id}.html`;

    const encoder = new TextEncoder();
    const htmlBytes = encoder.encode(htmlRefined);
    const htmlBlob = new Blob([htmlBytes], { type: 'text/html; charset=utf-8' });

    console.log('📤 [DECK_REFINE] Uploading refined HTML to storage...');

    const { error: uploadError } = await supabase.storage
      .from('decks')
      .update(fileName, htmlBlob, {
        contentType: 'text/html; charset=utf-8',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('❌ [DECK_REFINE] Upload failed:', uploadError);
      throw new Error(`Failed to upload refined HTML: ${uploadError.message}`);
    }

    // Get public URL (unchanged)
    const { data: { publicUrl } } = supabase.storage
      .from('decks')
      .getPublicUrl(fileName);

    console.log('✅ [DECK_REFINE] Uploaded to:', publicUrl);

    // 10. Create new version in deck_versions table
    console.log('📌 [DECK_REFINE] Creating version', newVersionNumber, '...');

    const { error: versionError } = await supabase
      .from('j_hub_deck_versions')
      .insert({
        deck_id: deck_id,
        version_number: newVersionNumber,
        html_output: htmlRefined,
        refinement_prompt: refinement_prompt,
        changes_summary: changesSummary,
        version_type: 'refined', // Refinement creates 'refined' versions
      });

    if (versionError) {
      console.error('❌ [DECK_REFINE] Version creation failed:', versionError);
      throw new Error(`Failed to create version: ${versionError.message}`);
    }

    console.log('✅ [DECK_REFINE] Version', newVersionNumber, 'created');

    // 11. Update deck record with refined HTML and new current_version
    const { error: updateError } = await supabase
      .from('j_hub_decks')
      .update({
        html_output: htmlRefined,
        file_url: publicUrl,
        current_version: newVersionNumber,
        is_refined: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deck_id);

    if (updateError) {
      console.error('❌ [DECK_REFINE] Deck update failed:', updateError);
      throw new Error(`Failed to update deck: ${updateError.message}`);
    }

    console.log('✅ [DECK_REFINE] Deck refinement completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        deck_id: deck_id,
        new_version: newVersionNumber,
        changes_summary: changesSummary,
        html_url: publicUrl,
        tokens_used: (claudeData.usage?.input_tokens || 0) + (claudeData.usage?.output_tokens || 0),
        latency_ms: latency,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ [DECK_REFINE] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
        status: 500
      }
    );
  }
});
