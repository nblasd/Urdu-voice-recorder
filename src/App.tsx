/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Languages, Copy, Check, RotateCcw, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { transcribeAudio, translateToEnglish } from './services/geminiService';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedType, setCopiedType] = useState<'transcription' | 'translation' | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        processAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Please allow microphone access to use this feature.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setTranscription('');
    setTranslation('');
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const result = await transcribeAudio(base64Audio, 'audio/webm');
        setTranscription(result);
        setIsProcessing(false);
      };
    } catch (err) {
      console.error('Error processing audio:', err);
      setIsProcessing(false);
    }
  };

  const handleTranslate = async () => {
    if (!transcription) return;
    setIsTranslating(true);
    try {
      const result = await translateToEnglish(transcription);
      setTranslation(result);
    } catch (err) {
      console.error('Error translating:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'transcription' | 'translation') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const reset = () => {
    setTranscription('');
    setTranslation('');
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        <header className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-4 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
              UrduVoice
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto font-light">
              Speak in Urdu or Roman Urdu. Get instant Roman Urdu transcription and English translation.
            </p>
          </motion.div>
        </header>

        <div className="grid gap-8">
          {/* Recording Section */}
          <section className="flex flex-col items-center justify-center p-12 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl shadow-2xl">
            <div className="relative mb-8">
              <AnimatePresence mode="wait">
                {isRecording && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl"
                  />
                )}
              </AnimatePresence>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 shadow-[0_0_40px_rgba(239,68,68,0.4)]' 
                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
                } disabled:opacity-50 disabled:cursor-not-allowed group`}
              >
                {isRecording ? (
                  <Square className="w-8 h-8 fill-white text-white" />
                ) : (
                  <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-2xl font-mono font-medium mb-2">
                {isRecording ? formatTime(recordingTime) : 'Ready to record'}
              </p>
              <p className="text-zinc-500 text-sm uppercase tracking-widest font-semibold">
                {isRecording ? 'Recording Urdu...' : 'Tap to start speaking'}
              </p>
            </div>
          </section>

          {/* Results Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Roman Urdu Transcription */}
            <motion.div 
              layout
              className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl transition-all hover:border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Volume2 size={20} />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Roman Urdu</h2>
                </div>
                {transcription && (
                  <button 
                    onClick={() => copyToClipboard(transcription, 'transcription')}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    {copiedType === 'transcription' ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                )}
              </div>

              <div className="min-h-[160px] flex flex-col">
                {isProcessing ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                    <p className="text-sm italic">Transcribing your voice...</p>
                  </div>
                ) : transcription ? (
                  <p className="text-xl leading-relaxed font-medium text-zinc-200">
                    {transcription}
                  </p>
                ) : (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-zinc-600 italic text-sm">
                    Transcription will appear here
                  </div>
                )}
              </div>

              {transcription && !isProcessing && (
                <div className="mt-8 flex gap-3">
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="flex-1 py-3 px-6 rounded-xl bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Languages size={18} />
                        Translate to English
                      </>
                    )}
                  </button>
                  <button
                    onClick={reset}
                    className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                    title="Clear all"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
              )}
            </motion.div>

            {/* English Translation */}
            <motion.div 
              layout
              className="group relative p-8 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-xl transition-all hover:border-white/10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Languages size={20} />
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">English</h2>
                </div>
                {translation && (
                  <button 
                    onClick={() => copyToClipboard(translation, 'translation')}
                    className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    {copiedType === 'translation' ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                  </button>
                )}
              </div>

              <div className="min-h-[160px] flex flex-col">
                {isTranslating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                    <p className="text-sm italic">Translating to English...</p>
                  </div>
                ) : translation ? (
                  <p className="text-xl leading-relaxed font-medium text-zinc-200">
                    {translation}
                  </p>
                ) : (
                  <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-zinc-600 italic text-sm">
                    Translation will appear here
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        <footer className="mt-24 text-center text-zinc-600 text-sm">
          <p>© {new Date().getFullYear()} UrduVoice</p>
        </footer>
      </main>
    </div>
  );
}
