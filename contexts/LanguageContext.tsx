'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLanguage, TranslationStrings, TutorMode } from '@/types';

type TranslationMap = Record<SupportedLanguage, TranslationStrings>;

const translations: TranslationMap = {
  en: {
    appTitle: 'Vernacular AI',
    askQuestion: 'Ask a question...',
    tapToRecord: 'Tap to record',
    captureTextbook: 'Capture textbook',
    recording: 'Recording...',
    processing: 'Processing...',
    settings: 'Settings',
    language: 'Language',
    english: 'English',
    hindi: 'Hindi',
    telugu: 'Telugu',
    send: 'Send',
    retake: 'Retake',
    confirm: 'Confirm',
    cancel: 'Cancel',
    offline: 'You are offline',
    offlineMessage: 'Please check your internet connection',
    retry: 'Retry',
    missionControl: 'Mission Control',
    npuMemory: 'NPU Memory',
    micStatus: 'Mic Status',
    tokenSpeed: 'Token Speed',
    systemLogs: 'System Logs',
    connected: 'Connected',
    disconnected: 'Disconnected',
    newChat: 'New Chat',
    recentChats: 'Recent Chats',
    noChats: 'No saved conversations yet',
    theme: 'Appearance',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    tutorMode: 'Tutor Persona',
    quickSummary: 'Quick Summary',
    socraticExplainer: 'Deep Socratic Explainer',
    clearConversations: 'Clear All Conversations',
    clearConfirm: 'Are you sure you want to delete all saved conversations?',
    flashcard: 'Flashcard',
    readAloud: 'Read Aloud',
    stopAudio: 'Stop Audio',
  },
  hi: {
    appTitle: 'वर्नाक्युलर AI',
    askQuestion: 'एक सवाल पूछो...',
    tapToRecord: 'रिकॉर्ड करने के लिए टैप करें',
    captureTextbook: 'पाठ्यपुस्तक कैप्चर करें',
    recording: 'रिकॉर्डिंग...',
    processing: 'प्रोसेसिंग...',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    english: 'अंग्रेज़ी',
    hindi: 'हिंदी',
    telugu: 'తెలుగు',
    send: 'भेजें',
    retake: 'फिर से लें',
    confirm: 'पुष्टि करें',
    cancel: 'रद्द करें',
    offline: 'आप ऑफलाइन हैं',
    offlineMessage: 'कृपया अपना इंटरनेट कनेक्शन जांचें',
    retry: 'पुनः प्रयास करें',
    missionControl: 'मिशन कंट्रोल',
    npuMemory: 'NPU मेमोरी',
    micStatus: 'माइक स्थिति',
    tokenSpeed: 'टोकन स्पीड',
    systemLogs: 'सिस्टम लॉग्स',
    connected: 'कनेक्टेड',
    disconnected: 'डिस्कनेक्टेड',
    newChat: 'नया चैट',
    recentChats: 'हाल के चैट',
    noChats: 'अभी तक कोई चैट सहेजी नहीं गई',
    theme: 'थीम',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    tutorMode: 'शिक्षक मोड',
    quickSummary: 'त्वरित सारांश',
    socraticExplainer: 'विस्तृत सुकराती व्याख्या',
    clearConversations: 'सभी बातचीत मिटाएं',
    clearConfirm: 'क्या आप वाकई सभी सहेजी गई बातचीत हटाना चाहते हैं?',
    flashcard: 'फ्लैशकार्ड',
    readAloud: 'बोलकर सुनाएं',
    stopAudio: 'रोकें',
  },
  te: {
    appTitle: 'వర్నాక్యులర్ AI',
    askQuestion: 'ఒక ప్రశ్న అడగండి...',
    tapToRecord: 'రికార్డ్ చేయడానికి నొక్కండి',
    captureTextbook: 'పాఠ్యపుస్తకాన్ని క్యాప్చర్ చేయండి',
    recording: 'రికార్డింగ్...',
    processing: 'ప్రాసెసింగ్...',
    settings: 'సెట్టింగ్స్',
    language: 'భాష',
    english: 'ఆంగ్లం',
    hindi: 'హిందీ',
    telugu: 'తెలుగు',
    send: 'పంపండి',
    retake: 'మళ్ళీ తీయండి',
    confirm: 'నిర్ధారించండి',
    cancel: 'రద్దు చేయండి',
    offline: 'మీరు ఆఫ్లైన్లో ఉన్నారు',
    offlineMessage: 'దయచేసి మీ ఇంటర్నెట్ కనెక్షన్ తనిఖీ చేయండి',
    retry: 'మళ్ళీ ప్రయత్నించండి',
    missionControl: 'మిషన్ కంట్రోల్',
    npuMemory: 'NPU మెమరీ',
    micStatus: 'మైక్ స్థితి',
    tokenSpeed: 'టోకెన్ స్పీడ్',
    systemLogs: 'సిస్టమ్ లాగ్స్',
    connected: 'కనెక్ట్ అయింది',
    disconnected: 'డిస్కనెక్ట్ అయింది',
    newChat: 'కొత్త చాట్',
    recentChats: 'ఇటీవలి సంభాషణలు',
    noChats: 'ఇంకా సంభాషణలు సేవ్ చేయలేదు',
    theme: 'రూపురేఖలు',
    darkMode: 'డార్క్ మోడ్',
    lightMode: 'లైట్ మోడ్',
    tutorMode: 'బోధన విధానం',
    quickSummary: 'త్వరిత సారాంశం',
    socraticExplainer: 'లోతైన వివరణ',
    clearConversations: 'అన్ని చాట్‌లను తొలగించు',
    clearConfirm: 'మీరు ఖచ్చితంగా అన్ని సంభాషణలను తొలగించాలనుకుంటున్నారా?',
    flashcard: 'ఫ్లాష్‌కార్డ్',
    readAloud: 'చదివి వినిపించు',
    stopAudio: 'ఆపు',
  }
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  tutorMode: TutorMode;
  setTutorMode: (mode: TutorMode) => void;
  t: (key: keyof TranslationStrings) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [tutorMode, setTutorModeState] = useState<TutorMode>('summary');

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('vernacular_lang') as SupportedLanguage;
      if (savedLang && (savedLang === 'en' || savedLang === 'hi' || savedLang === 'te')) {
        setLanguageState(savedLang);
      }

      const savedTheme = localStorage.getItem('vernacular_theme') as 'dark' | 'light';
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setThemeState(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        document.documentElement.classList.add('dark');
      }

      const savedMode = localStorage.getItem('vernacular_tutor_mode') as TutorMode;
      if (savedMode && (savedMode === 'summary' || savedMode === 'socratic')) {
        setTutorModeState(savedMode);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('vernacular_lang', lang);
    } catch {}
  };

  const setTheme = (newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('vernacular_theme', newTheme);
    } catch {}
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setTutorMode = (mode: TutorMode) => {
    setTutorModeState(mode);
    try {
      localStorage.setItem('vernacular_tutor_mode', mode);
    } catch {}
  };

  const t = (key: keyof TranslationStrings): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, theme, setTheme, toggleTheme, tutorMode, setTutorMode, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
