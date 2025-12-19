export const STRINGS = {
    TITLE: 'Real-Time AI Assistant',
    SUBTITLE: 'Have a voice conversation with your career assistant.',
    CUSTOMIZE_SECTION_TITLE: 'Customize Your Assistant',
    RESPONSE_TONE_LABEL: 'Response Tone',
    CUSTOM_INSTRUCTION_LABEL: 'Custom Instruction (Optional)',
    CUSTOM_INSTRUCTION_PLACEHOLDER: "e.g., 'Act as a pirate career coach.' or 'Always end your responses with a motivational quote.'",
    START_CONVERSATION: 'Start Conversation',
    CONNECTING: 'Connecting...',
    END_CONVERSATION: 'End Conversation',
    ERROR_CONNECTION: 'A connection error occurred. Please try again.',
    ERROR_MICROPHONE: 'Could not access the microphone. Please grant permission and try again.',
    EMPTY_STATE_MESSAGE: 'Click "Start Conversation" to begin.',
    
    SYSTEM_INSTRUCTION_BASE: 'You are a career assistant for the Alpha Consortium platform.',
    SYSTEM_INSTRUCTION_PROFESSIONAL: ' Your tone should be formal, direct, and focused on providing clear, actionable advice.',
    SYSTEM_INSTRUCTION_CREATIVE: ' Your tone should be engaging, expressive, and use imaginative examples to help users think outside the box.',
    SYSTEM_INSTRUCTION_BOLD: ' Your tone should be confident, assertive, and motivational, pushing users to aim high.',
    SYSTEM_INSTRUCTION_FRIENDLY: ' Your tone should be friendly, helpful, and conversational. Keep your answers concise.',
    SYSTEM_INSTRUCTION_CUSTOM_PREFIX: '\n\nAdditionally, follow this specific instruction: ',

    GEMINI_MODEL_ID: 'gemini-2.5-flash-native-audio-preview-09-2025',
    AUDIO_MIME_TYPE: 'audio/pcm;rate=16000',
    LOG_SESSION_ERROR: 'Session error:',
    TONE_FRIENDLY: 'Friendly',
    TONE_PROFESSIONAL: 'Professional',
    TONE_CREATIVE: 'Creative',
    TONE_BOLD: 'Bold'
} as const;
