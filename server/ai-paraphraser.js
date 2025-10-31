const OpenAI = require('openai');

class TweetParaphraser {
  constructor(apiKey) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    console.log(`🔑 Initializing OpenAI with key: ${key ? key.substring(0, 20) + '...' : 'NO KEY'}`);
    
    this.openai = new OpenAI({
      apiKey: key
    });
    
    // Fallback synonyms for when AI is not available
    this.synonyms = {
      // Common words - SIMPLE CONVERSATIONAL ALTERNATIVES
      'good': ['great', 'nice', 'cool', 'solid', 'fine'],
      'bad': ['terrible', 'awful', 'not good', 'rough', 'crappy'],
      'very': ['really', 'so', 'super', 'pretty', 'quite'],
      'think': ['believe', 'feel', 'guess', 'figure', 'reckon'],
      'make': ['create', 'build', 'do', 'put together', 'get'],
      'get': ['grab', 'pick up', 'find', 'take', 'have'],
      'want': ['need', 'would like', 'wish', 'hope for', 'looking for'],
      'say': ['tell', 'mention', 'go', 'be like', 'talk about'],
      'see': ['look at', 'check out', 'notice', 'spot', 'find'],
      'know': ['understand', 'get', 'realize', 'see', 'figure out'],
      
      // Tech/crypto specific - KEEP IT SIMPLE
      'broken': ['busted', 'not working', 'messed up', 'screwed up', 'broken'],
      'working': ['building', 'doing', 'making', 'on', 'busy with'],
      'algo': ['algorithm', 'system', 'algo', 'feed', 'algorithm'],
      'content': ['posts', 'stuff', 'tweets', 'things', 'material'],
      'sucks': ['is bad', 'is terrible', 'is trash', 'stinks', 'is weak'],
      'tired': ['exhausted', 'beat', 'worn out', 'drained', 'done'],
      
      // Phrases
      "can't": ["cannot", "unable to", "can not", "won't be able to"],
      "don't": ["do not", "doesn't", "never", "won't"],
      "it's": ["it is", "that's", "this is", "it's"],
      "I'm": ["I am", "I'm", "I am", "I am"],
      "you're": ["you are", "you're", "you are"],
      "we're": ["we are", "we're", "we are"],
      
      // Internet slang
      'lol': ['haha', 'lmao', 'funny', 'hilarious'],
      'omg': ['wow', 'holy crap', 'unbelievable', 'incredible'],
      'btw': ['by the way', 'also', 'additionally', 'fyi'],
      'imo': ['in my opinion', 'i think', 'i believe', 'personally'],
      
      // Crypto/Tech specific
      'crypto': ['cryptocurrency', 'digital currency', 'crypto', 'blockchain'],
      'hodl': ['hold', 'keep', 'maintain', 'retain'],
      'moon': ['skyrocket', 'explode', 'surge', 'pump'],
      'rekt': ['destroyed', 'wrecked', 'crushed', 'obliterated'],
      'diamond hands': ['strong hands', 'steady hands', 'firm grip', 'unwavering'],
    };
  }

  async paraphraseTweet(originalText) {
    try {
      const charCount = originalText.length;
      console.log(`🤖 Paraphrasing tweet (${charCount} chars): ${originalText.substring(0, 50)}...`);
      
      // For very long tweets (like threads), we need more tokens
      const maxTokens = charCount > 500 ? 1000 : 500;
      
      // Analyze the original tweet
      const analysis = this.analyzeTweet(originalText);
      
      const prompt = `
You are Vivek, a crypto Twitter user who rewrites other people's tweets in your own style. Here's your complete story and mission:

WHO YOU ARE:
- You're Vivek, a crypto trader who finds valuable information
- When you learn something useful, you share it with YOUR community
- You explain concepts in YOUR own way, like teaching friends
- You're NOT copying - you're sharing knowledge you found valuable
- You use simple, conversational English like Indians talk casually

YOUR MISSION:
You found valuable crypto information and want to share it with your community. Your goal is:
1. Share the same valuable knowledge and insights
2. Explain it in YOUR own words as if YOU're teaching it
3. Sound like YOU wrote it, not like a copy
4. Make your followers learn the same important things
5. Present it naturally in YOUR voice
6. Keep it simple and conversational for YOUR audience

WHAT YOU'RE DOING RIGHT NOW:
Someone saved a tweet and wants you to rewrite it. The original tweet has ${(originalText.match(/\n/g) || []).length} line breaks, and your rewritten version MUST have exactly the same number of line breaks in the same positions.

Original tweet to rewrite:
"${originalText}"

YOUR REWRITING RULES (FOLLOW THESE EXACTLY):

STRUCTURE PRESERVATION (MOST IMPORTANT):
1. COUNT THE LINE BREAKS: The original has ${(originalText.match(/\n/g) || []).length} line breaks
2. YOUR OUTPUT MUST HAVE EXACTLY ${(originalText.match(/\n/g) || []).length} line breaks
3. PRESERVE EMPTY LINES: If there's a blank line between paragraphs, keep it blank
4. PRESERVE LIST STRUCTURE: If it's a numbered list, keep it numbered
5. PRESERVE SENTENCE ORDER: Don't rearrange sentences or paragraphs
6. PRESERVE FORMATTING: Keep the same visual structure when displayed

CONTENT REWRITING (MAKE IT YOUR OWN):
7. SAME MEANING: Don't change what the tweet is saying
8. SAME TONE: Keep the ${analysis.tone} tone
9. SAME STYLE: Maintain the ${analysis.style} style
10. SIMILAR LENGTH: Keep it similar length (${charCount} chars is the original, you can be ±100 chars different)
11. SAME MOOD: Keep the ${analysis.mood} mood
12. REWRITE EVERYTHING: Don't just change a few words - rewrite entire sentences
13. MAKE IT SOUND ORIGINAL: Like you thought of this yourself
14. USE SIMPLE ENGLISH: Everyday words Indians use when talking casually

SPECIFIC ELEMENTS TO PRESERVE:
15. Keep numbers EXACTLY as they are (prices, percentages, dates)
16. Keep mentions (@username) EXACTLY as they are
17. Keep hashtags (#crypto) EXACTLY as they are
18. Keep emojis in similar positions
19. Keep questions as questions
20. Keep caps/lowercase the same
21. Keep punctuation style the same

FOR DIFFERENT CONTENT TYPES:

LONG TWEETS (like this one):
- Take your time to rewrite each section completely
- Don't rush - make sure each paragraph sounds like your own words
- Rewrite each list item completely but keep the same structure
- For technical content, explain it in simpler terms
- For analysis, put it in your own perspective

LISTS AND NUMBERED POINTS:
- Rewrite each list item completely
- Keep the same number of items
- Keep the same order
- Make each point sound like your own analysis

PARAGRAPHS:
- Rewrite each paragraph as if you're explaining it to a friend
- Use different sentence structures
- Change the way you present the information
- Keep the same flow and logic

TECHNICAL CONTENT:
- Explain complex concepts in simpler terms
- Use everyday analogies when possible
- Make it more conversational
- Keep the technical accuracy but simplify the language

YOUR WRITING STYLE:
- Use simple, conversational English
- Sound like you're talking to a friend
- Use words like: nice, cool, good, bad, really, so, very, think, know, get, make, do, want, like, feel
- Avoid fancy or academic words
- Keep it natural and casual
- Sound like an Indian crypto trader talking to friends

EXAMPLES OF YOUR REWRITING STYLE:
- "I'm tired" → "I'm worn out" (NOT "I'm fatigued")
- "This is crazy" → "This is wild" (NOT "This is preposterous")
- "Working on my project" → "Working on my thing" (NOT "Laboring on my endeavor")
- "Can't believe this" → "Can't believe it" (NOT "Cannot comprehend this")
- "Let's rest together" → "Let's rest with each other" (NOT "Let's repose in unison")
- "I know you're tired" → "I know you're beat" (NOT "I perceive you're fatigued")
- "This is good" → "This is nice" or "This is cool" (NOT "This is excellent")
- "I think so" → "I guess so" or "Maybe" (NOT "I believe so")
- "Very important" → "Really important" or "So important" (NOT "Extremely significant")
- "I don't know" → "I have no idea" or "No clue" (NOT "I am unaware")

WHAT MAKES YOUR REWRITES GOOD:
- They sound completely original
- They're easy to understand
- They keep the same valuable information
- They have your own personality and style
- They don't look like copies
- They're conversational and natural
- They preserve the structure perfectly

CRITICAL REMINDERS:
- The original has ${(originalText.match(/\n/g) || []).length} line breaks - your output MUST have exactly the same
- Don't truncate or shorten the content - include EVERYTHING
- If input has "text\\n\\ntext\\n\\ntext", output MUST also have "text\\n\\ntext\\n\\ntext"
- Make substantial changes to avoid looking like a copy
- Take your time with longer content - rewrite each section completely
- Think of it as explaining the same thing to a friend using completely different words

YOUR GOAL:
Share this valuable knowledge with YOUR community in YOUR own voice. Same important information, but explained like YOU'RE teaching it to your followers. Make it sound natural, like something you'd post to share helpful crypto insights with your community. Don't copy - teach and share the knowledge.

Now rewrite this tweet in your own words (${charCount} chars):`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview", // Using GPT-4 for better instruction following
        messages: [
          {
            role: "system",
            content: "You are Vivek, a crypto trader sharing valuable knowledge with your community. CRITICAL STRUCTURE RULE: You MUST preserve ALL line breaks and empty lines exactly as they appear in the input. If input has N lines, output MUST have N lines in same positions. Use actual newlines, not '\\n' text. Rewrite in YOUR own voice as if teaching your followers. Use simple, conversational Indian English."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens, // Dynamic based on tweet length
        temperature: 0.3, // Lower temperature for more consistent paraphrasing
      });

      let paraphrased = completion.choices[0].message.content.trim();
      
      // Remove quotes if AI added them
      paraphrased = paraphrased.replace(/^["']|["']$/g, '');
      
      // Fix literal \n being shown instead of actual line breaks
      // Replace literal \n with actual newlines if they appear
      if (paraphrased.includes('\\n') && !paraphrased.includes('\n')) {
        console.log('🔧 Fixing literal \\n to actual line breaks');
        paraphrased = paraphrased.replace(/\\n/g, '\n');
      }
      
      const cleanParaphrased = paraphrased;
      
      // Check if line breaks are preserved
      const originalLineBreaks = (originalText.match(/\n/g) || []).length;
      const paraphrasedLineBreaks = (cleanParaphrased.match(/\n/g) || []).length;
      
      if (originalLineBreaks !== paraphrasedLineBreaks) {
        console.log(`⚠️ Line breaks not preserved: ${originalLineBreaks} vs ${paraphrasedLineBreaks}`);
        console.log('🔄 Attempting to fix line structure...');
        
        // If AI messed up line breaks, try to fix it
        const originalLines = originalText.split('\n');
        const paraphrasedLines = cleanParaphrased.split('\n').filter(line => line.trim() !== '');
        
        // If we have the same number of non-empty lines, reconstruct with proper spacing
        if (paraphrasedLines.length === originalLines.filter(l => l.trim() !== '').length) {
          let reconstructed = [];
          let paraphrasedIndex = 0;
          
          for (const origLine of originalLines) {
            if (origLine.trim() === '') {
              reconstructed.push(''); // Preserve empty lines
            } else {
              reconstructed.push(paraphrasedLines[paraphrasedIndex] || origLine);
              paraphrasedIndex++;
            }
          }
          
          const fixed = reconstructed.join('\n');
          console.log(`✅ Fixed line structure`);
          return fixed;
        }
      }
      
      // Validate length is similar - BE FLEXIBLE
      if (Math.abs(cleanParaphrased.length - charCount) > 200) {
        console.log(`⚠️ Length mismatch: ${cleanParaphrased.length} vs ${charCount}, but accepting anyway`);
        // Don't use fallback - just accept the AI result
      }
      
      console.log(`✅ Paraphrased: ${cleanParaphrased}`);
      return cleanParaphrased;
      
    } catch (error) {
      console.error('❌ AI Paraphrase error:', error.message);
      console.error('Full error:', error);
      console.log('🔄 Using fallback paraphrasing...');
      const fallbackResult = this.fallbackParaphrase(originalText);
      console.log(`🔄 Fallback input: "${originalText}"`);
      console.log(`🔄 Fallback output: "${fallbackResult}"`);
      // If fallback returns the same text, at least try to change something
      if (fallbackResult === originalText) {
        console.log('⚠️ Fallback returned same text, trying basic changes...');
        // Very basic changes as last resort
        let modified = originalText
          .replace(/\bi'm\b/gi, "I am")
          .replace(/\bit's\b/gi, "it is")
          .replace(/\bdon't\b/gi, "do not")
          .replace(/\bcan't\b/gi, "cannot");
        return modified !== originalText ? modified : originalText;
      }
      return fallbackResult;
    }
  }

  analyzeTweet(text) {
    return {
      tone: this.detectTone(text),
      style: this.detectStyle(text),
      mood: this.detectMood(text),
      hasQuestion: text.includes('?'),
      hasExclamation: text.includes('!'),
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(text),
      hasMention: text.includes('@'),
      hasHashtag: text.includes('#'),
      isUpperCase: text === text.toUpperCase(),
      startsWithLowercase: text[0] === text[0].toLowerCase()
    };
  }

  detectTone(text) {
    const lower = text.toLowerCase();
    if (lower.includes('lol') || lower.includes('lmao') || lower.includes('😂') || lower.includes('haha')) 
      return 'humorous';
    if (text.includes('?')) 
      return 'questioning';
    if (text.includes('!')) 
      return 'excited';
    if (lower.includes('please') || lower.includes('thank')) 
      return 'polite';
    if (lower.includes('fuck') || lower.includes('shit') || lower.includes('damn'))
      return 'casual/edgy';
    return 'casual';
  }

  detectStyle(text) {
    if (text.length < 50) return 'brief';
    if (!text.includes('.') && !text.includes('!') && !text.includes('?')) 
      return 'no punctuation';
    if (text.split('.').length > 3) return 'multiple sentences';
    if (text.includes('\n')) return 'multi-line';
    return 'standard';
  }

  detectMood(text) {
    const lower = text.toLowerCase();
    if (lower.includes('sad') || lower.includes('tired') || lower.includes('exhausted') || lower.includes('sucks'))
      return 'tired/sad';
    if (lower.includes('excited') || lower.includes('amazing') || lower.includes('awesome') || lower.includes('moon'))
      return 'excited';
    if (lower.includes('angry') || lower.includes('frustrated') || lower.includes('annoyed') || lower.includes('rekt'))
      return 'frustrated';
    if (lower.includes('gm') || lower.includes('good morning'))
      return 'greeting';
    return 'neutral';
  }

  fallbackParaphrase(text) {
    console.log('🔄 Using fallback synonym replacement...');
    let paraphrased = text;
    
    // Preserve line breaks and structure
    const hasLineBreaks = text.includes('\n');
    const lines = text.split('\n');
    
    // Process each line separately to preserve structure
    const processedLines = lines.map(line => {
      let processedLine = line;
      
      // Only replace words, not structure
      for (const [word, synonyms] of Object.entries(this.synonyms)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        if (regex.test(processedLine)) {
          const replacement = synonyms[Math.floor(Math.random() * synonyms.length)];
          // Match the case of the original word
          processedLine = processedLine.replace(regex, (match) => {
            if (match[0] === match[0].toUpperCase()) {
              return replacement.charAt(0).toUpperCase() + replacement.slice(1);
            }
            return replacement;
          });
        }
      }
      
      return processedLine;
    });
    
    // Rejoin with same line breaks
    paraphrased = processedLines.join('\n');
    
    console.log(`🔄 Fallback result: ${paraphrased}`);
    return paraphrased;
  }

  restructureSentence(text) {
    // DON'T restructure - keep exact same structure
    // Just return the text as-is to preserve formatting
    return text;
  }

  // Preview function for extension
  async previewParaphrase(text) {
    try {
      const paraphrased = await this.paraphraseTweet(text);
      return {
        original: text,
        paraphrased: paraphrased,
        characterDiff: paraphrased.length - text.length,
        success: true
      };
    } catch (error) {
      return {
        original: text,
        paraphrased: text,
        characterDiff: 0,
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TweetParaphraser;
