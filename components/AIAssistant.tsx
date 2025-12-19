import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TranscriptionTurn } from '../types';
import { MicrophoneIcon } from './icons/Icons';
import { STRINGS } from '../strings';

// --- Helper Functions for Audio Encoding/Decoding ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

type Tone = 'Friendly' | 'Professional' | 'Creative' | 'Bold';

// --- Main Component ---
const AIAssistant: React.FC = () => {
    type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionTurn[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const [error, setError] = useState('');

    const [selectedTone, setSelectedTone] = useState<Tone>('Friendly');
    const [customInstruction, setCustomInstruction] = useState('');

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const outputNodeRef = useRef<GainNode | null>(null);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const currentInputRef = useRef('');
    const currentOutputRef = useRef('');
    const chatLogRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        // Scroll to bottom of chat log when new messages are added
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [transcriptionHistory, currentInput, currentOutput]);

    const cleanup = () => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        mediaStreamSourceRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();

        streamRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        sessionPromiseRef.current = null;
    };

    const handleStartConversation = async () => {
        setConnectionState('connecting');
        setError('');
        setTranscriptionHistory([]);
        setCurrentInput('');
        setCurrentOutput('');
        currentInputRef.current = '';
        currentOutputRef.current = '';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

            let systemInstruction = STRINGS.SYSTEM_INSTRUCTION_BASE;

            switch (selectedTone) {
                case 'Professional':
                    systemInstruction += STRINGS.SYSTEM_INSTRUCTION_PROFESSIONAL;
                    break;
                case 'Creative':
                    systemInstruction += STRINGS.SYSTEM_INSTRUCTION_CREATIVE;
                    break;
                case 'Bold':
                    systemInstruction += STRINGS.SYSTEM_INSTRUCTION_BOLD;
                    break;
                case 'Friendly':
                default:
                    systemInstruction += STRINGS.SYSTEM_INSTRUCTION_FRIENDLY;
                    break;
            }

            if (customInstruction.trim()) {
                systemInstruction += `${STRINGS.SYSTEM_INSTRUCTION_CUSTOM_PREFIX}${customInstruction.trim()}`;
            }

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setConnectionState('connected');
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        outputNodeRef.current = outputAudioContextRef.current.createGain();
                        outputNodeRef.current.connect(outputAudioContextRef.current.destination);

                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };

                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            currentInputRef.current += message.serverContent.inputTranscription.text;
                            setCurrentInput(currentInputRef.current);
                        }
                        if (message.serverContent?.outputTranscription) {
                             currentOutputRef.current += message.serverContent.outputTranscription.text;
                             setCurrentOutput(currentOutputRef.current);
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputRef.current;
                            const fullOutput = currentOutputRef.current;
                             setTranscriptionHistory(prev => [
                                ...prev,
                                { speaker: 'user', text: fullInput },
                                { speaker: 'model', text: fullOutput }
                            ]);
                            currentInputRef.current = '';
                            currentOutputRef.current = '';
                            setCurrentInput('');
                            setCurrentOutput('');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNodeRef.current);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        const interrupted = message.serverContent?.interrupted;
                        if (interrupted) {
                          for (const source of sourcesRef.current.values()) {
                            source.stop();
                            sourcesRef.current.delete(source);
                          }
                          nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError(STRINGS.ERROR_CONNECTION);
                        setConnectionState('error');
                        cleanup();
                    },
                    onclose: (e: CloseEvent) => {
                        setConnectionState('closed');
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: systemInstruction,
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error(err);
            setError(STRINGS.ERROR_MICROPHONE);
            setConnectionState('error');
        }
    };
    
    const handleEndConversation = () => {
        sessionPromiseRef.current?.then(session => session.close());
        cleanup();
        setConnectionState('idle');
    };

    const isConversationActive = connectionState === 'connecting' || connectionState === 'connected';

    return (
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">{STRINGS.TITLE}</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{STRINGS.SUBTITLE}</p>
                </div>

                <div className="mt-12 bg-white dark:bg-gray-800/30 backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-blue-500/20 shadow-lg dark:shadow-none space-y-6">
                    {!isConversationActive && (
                        <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-md border border-gray-200 dark:border-gray-700 animate-scale-in">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{STRINGS.CUSTOMIZE_SECTION_TITLE}</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {STRINGS.RESPONSE_TONE_LABEL}
                                </label>
                                <div role="radiogroup" className="flex flex-wrap gap-2">
                                    {(['Friendly', 'Professional', 'Creative', 'Bold'] as Tone[]).map(tone => (
                                        <button
                                            key={tone}
                                            type="button"
                                            role="radio"
                                            aria-checked={selectedTone === tone}
                                            onClick={() => setSelectedTone(tone)}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors duration-200 ${
                                                selectedTone === tone
                                                ? 'bg-blue-600 text-white shadow'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            {tone}
                                        </button>
                                    ))}
                                </div>
                            </div>
                             <div>
                                <label htmlFor="custom-instruction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {STRINGS.CUSTOM_INSTRUCTION_LABEL}
                                </label>
                                <textarea
                                    id="custom-instruction"
                                    rows={2}
                                    value={customInstruction}
                                    onChange={(e) => setCustomInstruction(e.target.value)}
                                    className="w-full bg-white dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder={STRINGS.CUSTOM_INSTRUCTION_PLACEHOLDER}
                                />
                            </div>
                        </div>
                    )}

                    <div 
                        ref={chatLogRef} 
                        role="log"
                        aria-live="polite"
                        aria-atomic="false"
                        className="h-96 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md space-y-4"
                    >
                        {transcriptionHistory.map((turn, index) => (
                            <div key={index} className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-lg ${turn.speaker === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    <p>{turn.text}</p>
                                </div>
                            </div>
                        ))}
                        {currentInput && <div className="flex justify-end"><div className="max-w-md p-3 rounded-lg bg-blue-500 text-white opacity-70"><p>{currentInput}</p></div></div>}
                        {currentOutput && <div className="flex justify-start"><div className="max-w-md p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 opacity-70"><p>{currentOutput}</p></div></div>}
                         {!isConversationActive && transcriptionHistory.length === 0 && (
                             <div className="text-center text-gray-400 dark:text-gray-500 h-full flex items-center justify-center">
                                {STRINGS.EMPTY_STATE_MESSAGE}
                            </div>
                         )}
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4">
                         <div className="relative flex items-center justify-center w-24 h-24">
                            <div className={`absolute inset-0 rounded-full bg-blue-500/20 ${connectionState === 'connected' ? 'animate-pulse' : ''}`}></div>
                            <div className="relative w-16 h-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                                <MicrophoneIcon className={`h-8 w-8 transition-colors ${connectionState === 'connected' ? 'text-blue-500' : 'text-gray-400'}`} />
                            </div>
                        </div>
                        {!isConversationActive ? (
                            <button onClick={handleStartConversation} className="px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-md shadow-lg hover:bg-blue-700">
                                {STRINGS.START_CONVERSATION}
                            </button>
                        ) : connectionState === 'connecting' ? (
                            <span className="text-gray-500 dark:text-gray-400">{STRINGS.CONNECTING}</span>
                        ) : (
                            <button onClick={handleEndConversation} className="px-6 py-3 text-base font-semibold text-white bg-red-600 rounded-md shadow-lg hover:bg-red-700">
                                {STRINGS.END_CONVERSATION}
                            </button>
                        )}
                        {error && <p className="text-sm text-red-500 dark:text-red-400 mt-2">{error}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;