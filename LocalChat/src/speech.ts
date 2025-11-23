const SPEECH_BASE_URL = 'http://localhost:9000';

export interface TTSRequest {
  text: string;
  voice?: string;
  format?: string;
}

export interface TTSResponse {
  audio_base64: string;
}

export interface STTResponse {
  text: string;
}

export const speechService = {
  /**
   * Convert speech to text using Whisper
   */
  async speechToText(audioBlob: Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'speech.webm');

      const response = await fetch(`${SPEECH_BASE_URL}/stt`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`STT API error: ${response.status}`);
      }

      const data: STTResponse = await response.json();
      return data.text || '';
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      throw error;
    }
  },

  /**
   * Preprocess text for TTS - clean and normalize text for natural speech
   * Manual preprocessing fallback (kept as reference)
   */
  preprocessForTTSManual(text: string): string {
    let cleaned = text;

    // Remove all emojis (comprehensive Unicode ranges)
    cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, ''); // Emoticons
    cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, ''); // Misc Symbols and Pictographs
    cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, ''); // Transport and Map
    cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, ''); // Flags
    cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, ''); // Misc symbols
    cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, ''); // Dingbats
    cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, ''); // Variation Selectors
    cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, ''); // Supplemental Symbols and Pictographs
    cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, ''); // Symbols and Pictographs Extended-A

    // Replace arrows with pauses
    cleaned = cleaned.replace(/→|←|↔|➡️|➔|➜|➝|➞|➟|➠|➡|➢|➣|➤/g, ', ');

    // Replace em-dash and en-dash with pauses
    cleaned = cleaned.replace(/—|–/g, ', ');

    // Expand common abbreviations
    cleaned = cleaned.replace(/\be\.g\.\s*/gi, 'for example ');
    cleaned = cleaned.replace(/\bi\.e\.\s*/gi, 'that is ');
    cleaned = cleaned.replace(/\betc\.?\s*/gi, 'etcetera ');
    cleaned = cleaned.replace(/\bvs\.?\s*/gi, 'versus ');
    cleaned = cleaned.replace(/\bSTT\b/g, 'speech to text');
    cleaned = cleaned.replace(/\bTTS\b/g, 'text to speech');
    cleaned = cleaned.replace(/\bLLM\b/g, 'large language model');

    // Remove markdown formatting (preserve spaces)
    cleaned = cleaned.replace(/\*\*\*(.+?)\*\*\*/g, '$1'); // Bold italic
    cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1'); // Bold
    cleaned = cleaned.replace(/\*(.+?)\*/g, '$1'); // Italic
    cleaned = cleaned.replace(/__(.+?)__/g, '$1'); // Underline
    cleaned = cleaned.replace(/_(.+?)_/g, '$1'); // Italic
    cleaned = cleaned.replace(/~~(.+?)~~/g, '$1'); // Strikethrough
    cleaned = cleaned.replace(/`{1,3}(.+?)`{1,3}/g, ' $1 '); // Code - add spaces
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, ''); // Headers

    // Remove markdown links but keep text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // Remove blockquotes
    cleaned = cleaned.replace(/^>\s+/gm, '');

    // Remove list markers but keep content
    cleaned = cleaned.replace(/^[\*\-\+]\s+/gm, '');
    cleaned = cleaned.replace(/^\d+\.\s+/gm, '');
    cleaned = cleaned.replace(/^•\s+/gm, '');
    cleaned = cleaned.replace(/^◦\s+/gm, '');
    cleaned = cleaned.replace(/^▪\s+/gm, '');
    cleaned = cleaned.replace(/^▫\s+/gm, '');
    
    // Handle hyphens in compound adjectives - convert to space
    cleaned = cleaned.replace(/(\w+)\-(\w+)/g, '$1 $2');

    // Remove table formatting and add pauses
    cleaned = cleaned.replace(/\|/g, ', ');
    cleaned = cleaned.replace(/[\-]{3,}/g, '. ');

    // Remove parentheses but keep spaces around content
    cleaned = cleaned.replace(/\(([^\)]+)\)/g, ' $1 ');

    // Remove all quotes completely (they cause weird patterns in speech)
    cleaned = cleaned.replace(/[""`''"']/g, '');

    // Remove excessive punctuation
    cleaned = cleaned.replace(/\.{2,}/g, '. ');
    cleaned = cleaned.replace(/!{2,}/g, '! ');
    cleaned = cleaned.replace(/\?{2,}/g, '? ');
    cleaned = cleaned.replace(/,{2,}/g, ', ');
    cleaned = cleaned.replace(/:{2,}/g, ': ');
    cleaned = cleaned.replace(/;{2,}/g, '; ');

    // Remove special characters that shouldn't be spoken (add spaces to prevent word joining)
    cleaned = cleaned.replace(/[#@$%^&*+=\[\]{}<>\\\/|~]/g, ' ');

    // Clean up whitespace FIRST (before fixing contractions)
    cleaned = cleaned.replace(/\s+/g, ' '); // Multiple spaces to single
    cleaned = cleaned.replace(/\s+([.,!?;:])/g, '$1'); // Space before punctuation
    cleaned = cleaned.replace(/([.,!?;:])\s*([.,!?;:])/g, '$1'); // Multiple punctuation
    
    // Ensure space after punctuation
    cleaned = cleaned.replace(/([.,!?;:])(\w)/g, '$1 $2');
    
    // Fix common contraction issues from quote removal
    cleaned = cleaned.replace(/\bIts\b/g, "It's");
    cleaned = cleaned.replace(/\bIm\b/g, "I'm");
    cleaned = cleaned.replace(/\bYoull\b/g, "You'll");
    cleaned = cleaned.replace(/\bTheyll\b/g, "They'll");
    cleaned = cleaned.replace(/\bWell\b(?! )/g, "We'll");
    cleaned = cleaned.replace(/\bHell\b(?! )/g, "He'll");
    cleaned = cleaned.replace(/\bShell\b(?! )/g, "She'll");
    cleaned = cleaned.replace(/\bWont\b/g, "Won't");
    cleaned = cleaned.replace(/\bCant\b/g, "Can't");
    cleaned = cleaned.replace(/\bDont\b/g, "Don't");
    cleaned = cleaned.replace(/\bDidnt\b/g, "Didn't");
    cleaned = cleaned.replace(/\bWouldnt\b/g, "Wouldn't");
    cleaned = cleaned.replace(/\bCouldnt\b/g, "Couldn't");
    cleaned = cleaned.replace(/\bShouldnt\b/g, "Shouldn't");
    cleaned = cleaned.replace(/\bHavent\b/g, "Haven't");
    cleaned = cleaned.replace(/\bHasnt\b/g, "Hasn't");
    cleaned = cleaned.replace(/\bHadnt\b/g, "Hadn't");
    cleaned = cleaned.replace(/\bIsnt\b/g, "Isn't");
    cleaned = cleaned.replace(/\bArent\b/g, "Aren't");
    cleaned = cleaned.replace(/\bWasnt\b/g, "Wasn't");
    cleaned = cleaned.replace(/\bWerent\b/g, "Weren't");
    
    // Fix compound words that got split (common patterns)
    cleaned = cleaned.replace(/\bgreat to meet\b/gi, 'great to meet');
    cleaned = cleaned.replace(/\bspeech to text\b/gi, 'speech to text');
    cleaned = cleaned.replace(/\btext to speech\b/gi, 'text to speech');
    
    // Final whitespace cleanup
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.trim();

    // Handle line breaks - convert to natural pauses (keep newlines for bigger pauses)
    cleaned = cleaned.replace(/\n{3,}/g, '.\n\n'); // Multiple line breaks - bigger pause
    cleaned = cleaned.replace(/\n{2}/g, '.\n'); // Double line break - medium pause
    cleaned = cleaned.replace(/\n/g, ', '); // Single line break - small pause

    return cleaned;
  },

  /**
   * Preprocess text for TTS - clean and normalize text for natural speech
   */
  preprocessForTTS(text: string): string {
    // Use manual preprocessing as primary method (more reliable than small LLMs)
    return this.preprocessForTTSManual(text);
  },

  /**
   * Convert text to speech using Kokoro
   */
  async textToSpeech(text: string, voice: string = 'af_heart', format: string = 'mp3'): Promise<string> {
    try {
      // Preprocess text first (manual regex-based cleaning)
      const processedText = this.preprocessForTTS(text);
      
      const response = await fetch(`${SPEECH_BASE_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: processedText, voice, format }),
      });

      if (!response.ok) {
        throw new Error(`TTS API error: ${response.status}`);
      }

      const data: TTSResponse = await response.json();
      return data.audio_base64;
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      throw error;
    }
  },

  /**
   * Check if speech services are available
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${SPEECH_BASE_URL}/`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('Speech service connection error:', error);
      return false;
    }
  },

  /**
   * Refine transcription using LLM
   */
  async refineTranscription(transcription: string): Promise<string> {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt: `Fix any grammatical errors and improve clarity of this transcription. Keep the meaning the same, just make it more readable. Output ONLY the refined text without any explanations or quotes.

Transcription: ${transcription}

Refined text:`,
          stream: false,
        }),
      });

      if (!response.ok) {
        // If refinement fails, return original
        return transcription;
      }

      const data = await response.json();
      return data.response?.trim() || transcription;
    } catch (error) {
      console.error('Error refining transcription:', error);
      return transcription;
    }
  },
};
