import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logger.js';

class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.ai = null;
    if (this.apiKey) {
      this.ai = new GoogleGenerativeAI(this.apiKey);
    } else {
      logger.warn('GEMINI_API_KEY is not defined in the environment. AI service will run in fallback mock mode.');
    }
  }

  async generateMeetingIntelligence(transcript) {
    if (!transcript || !transcript.trim()) {
      return this.getFallbackIntelligence('Empty transcript provided.');
    }

    if (!this.ai) {
      return this.getFallbackIntelligence(transcript);
    }

    try {
      logger.info('Sending transcript to Gemini API for summarization...');
      
      const model = this.ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `
        You are an AI meeting assistant. Analyze the following meeting transcript.
        Generate the meeting intelligence containing:
        1. Executive Summary: A concise paragraph summary of the meeting.
        2. Key Discussion Points: A list of main topics discussed.
        3. Action Items: A list of tasks, along with the suggested owner for each task (if a specific person can be identified from the transcript, else leave assignee empty).

        Provide the output strictly in the following JSON format:
        {
          "summary": "Executive Summary goes here...",
          "keyDiscussionPoints": [
            "Discussion point 1",
            "Discussion point 2"
          ],
          "actionItems": [
            {
              "text": "Action item description here",
              "completed": false,
              "assignee": "Suggested Owner name"
            }
          ]
        }

        Transcript:
        """
        ${transcript}
        """
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      logger.info('Gemini summary generated successfully.');
      
      try {
        const parsed = JSON.parse(responseText.trim());
        return {
          summary: parsed.summary || 'Summary not provided by AI.',
          keyDiscussionPoints: Array.isArray(parsed.keyDiscussionPoints) ? parsed.keyDiscussionPoints : [],
          actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems.map(item => ({
            text: item.text || 'Unnamed action item',
            completed: !!item.completed,
            assignee: item.assignee || ''
          })) : []
        };
      } catch (parseErr) {
        logger.error('Failed to parse JSON response from Gemini:', parseErr);
        logger.debug('Raw response was:', responseText);
        return this.getFallbackIntelligence(transcript);
      }
    } catch (apiErr) {
      logger.error('Gemini API request failed:', apiErr);
      return this.getFallbackIntelligence(transcript);
    }
  }

  getFallbackIntelligence(transcript) {
    logger.info('Generating structured fallback summary from transcript metadata.');
    
    // Parse speaker lines if present to create simple fallback discussion points
    const lines = transcript.split('\n').filter(l => l.trim());
    const discussionPoints = [];
    const actionItems = [];
    
    if (lines.length > 0) {
      lines.slice(0, 3).forEach(line => {
        // Remove timestamps e.g. [12:30:15]
        const cleanLine = line.replace(/^\[.*?\]\s*/, '');
        discussionPoints.push(`Participant input recorded: "${cleanLine.slice(0, 80)}${cleanLine.length > 80 ? '...' : ''}"`);
      });
    }

    if (discussionPoints.length === 0) {
      discussionPoints.push('General collaboration session was held.');
    }

    actionItems.push({
      text: 'Verify action items and review dynamic transcript logs',
      completed: false,
      assignee: 'All Participants'
    });

    return {
      summary: `A collaborative sync session was held. Raw transcript of length ${transcript.length} characters was saved. AI synthesis was offline or hit an API error, falling back to cached transcript data.`,
      keyDiscussionPoints: discussionPoints,
      actionItems: actionItems
    };
  }
}

const aiService = new AIService();
export default aiService;
