
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { TranscriptionTurn } from '../types';
import { MicrophoneIcon } from './icons/Icons';

// --- Helper Functions for Audio Encoding/Decoding ---

/**
 * Encodes a Uint8Array to a base64 string.
 *
 * @param bytes - The input byte array.
 * @returns The base64 encoded string.
 */
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a base64 string to a Uint8Array.
 *
 * @param base64 - The base64 encoded string.
 * @returns The decoded byte array.
 */
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes audio data into an AudioBuffer.
 *
 * @param data - The raw audio data as a Uint8Array.
 * @param ctx - The AudioContext to use for creating the buffer.
 * @param sampleRate - The sample rate of the audio data.
 * @param numChannels - The number of channels in the audio data.
 * @returns A promise that resolves to the decoded AudioBuffer.
 */
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

/**
 * Creates a Blob from Float32Array audio data.
 *
 * @param data - The audio data.
 * @returns A Blob object containing the audio data.
 */
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

/**
 * AIAssistant Component
 *
 * This component provides an interface for a real-time voice interaction with an AI assistant
 * powered by Google's GenAI. It handles audio recording, streaming to the AI model,
 * playing back the AI's audio response, and displaying the transcription history.
 *
 * Features:
 * - Real-time audio streaming (input and output).
 * - Transcription display for both user and AI.
 * - Customizable tone/persona for the AI.
 * - Custom instructions for the AI.
 * - Visual feedback for connection state and audio activity.
 */
const AIAssistant: React.FC = () => {
    type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'closed';
    const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
    const [transcriptionHistory, setTranscriptionHistory] = useState<TranscriptionTurn[]>([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentOutput, setCurrentOutput] = useState('');
    const [error, setError] = useState('');

    const [selectedTone, setSelectedTone] = useState<Tone>('Friendly');
    const [customInstruction, setCustomInstruction] = useState('');

    const sessionPromiseRef = useRef<Promise<any> | null>(null);
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

            let systemInstruction = 'You are a career assistant for the Alpha Consortium platform.';

            switch (selectedTone) {
                case 'Professional':
                    systemInstruction += ' Your tone should be formal, direct, and focused on providing clear, actionable advice.';
                    break;
                case 'Creative':
                    systemInstruction += ' Your tone should be engaging, expressive, and use imaginative examples to help users think outside the box.';
                    break;
                case 'Bold':
                    systemInstruction += ' Your tone should be confident, assertive, and motivational, pushing users to aim high.';
                    break;
                case 'Friendly':
                default:
                    systemInstruction += ' Your tone should be friendly, helpful, and conversational. Keep your answers concise.';
                    break;
            }

            if (customInstruction.trim()) {
                systemInstruction += `\n\nAdditionally, follow this specific instruction: ${customInstruction.trim()}`;
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
                        setError('A connection error occurred. Please try again.');
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
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                    }
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error(err);
            setError('Could not access the microphone. Please grant permission and try again.');
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
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl font-orbitron neon-text">AI Career Voice Assistant</h2>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Have a real-time voice conversation with our AI to get career advice, practice interviews, or learn about the Balkan job market.</p>
                </div>

                <div className="bg-white dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-blue-500/20 shadow-xl overflow-hidden flex flex-col h-[600px]">
                    {/* Chat Log */}
                    <div ref={chatLogRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {transcriptionHistory.map((turn, index) => (
                            <div key={index} className={`flex ${turn.speaker === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                                    turn.speaker === 'user' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                                }`}>
                                    <p>{turn.text}</p>
                                </div>
                            </div>
                        ))}
                        {currentInput && (
                            <div className="flex justify-end">
                                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-blue-600/50 text-white animate-pulse">
                                    <p>{currentInput}</p>
                                </div>
                            </div>
                        )}
                        {currentOutput && (
                            <div className="flex justify-start">
                                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm bg-gray-100/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 animate-pulse">
                                    <p>{currentOutput}</p>
                                </div>
                            </div>
                        )}
                        {transcriptionHistory.length === 0 && !currentInput && !currentOutput && (
                             <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 px-10">
                                <MicrophoneIcon className="h-12 w-12 mb-4 opacity-20" />
                                <p>Click the button below to start your conversation. You can ask about job trends, resume tips, or relocation advice.</p>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Voice Tone</label>
                                <div className="flex gap-2">
                                    {(['Friendly', 'Professional', 'Creative', 'Bold'] as Tone[]).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedTone(t)}
                                            disabled={isConversationActive}
                                            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium border transition-all ${
                                                selectedTone === t 
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-shrink-0">
                                {!isConversationActive ? (
                                    <button
                                        onClick={handleStartConversation}
                                        className="inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-500 transition-all transform hover:scale-110 active:scale-95"
                                        aria-label="Start Conversation"
                                    >
                                        <MicrophoneIcon className="h-8 w-8" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleEndConversation}
                                        className="inline-flex items-center justify-center rounded-full bg-red-600 p-4 text-white shadow-lg hover:bg-red-500 transition-all transform hover:scale-110 active:scale-95 animate-pulse"
                                        aria-label="End Conversation"
                                    >
                                        <div className="h-8 w-8 flex items-center justify-center">
                                            <div className="w-4 h-4 bg-white rounded-sm"></div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>
                        {error && <p className="mt-4 text-center text-xs text-red-500 font-medium">{error}</p>}
                        {connectionState === 'connecting' && <p className="mt-4 text-center text-xs text-blue-500 font-medium animate-pulse">Establishing secure voice link...</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
