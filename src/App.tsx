/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-groovy';
import 'prismjs/themes/prism-tomorrow.css';
import { 
  Zap, 
  Code2, 
  Copy, 
  Download, 
  ChevronRight, 
  CreditCard, 
  Loader2,
  Terminal,
  Sparkles,
  Wand2,
  Globe,
  MessageSquare,
  Brain,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import beautify from 'js-beautify';
import { translations, Language } from './translations';
import { ExecutionPanel } from './ExecutionPanel';
import { AuthPortal } from './AuthPortal';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

const SYSTEM_PROMPT = `Você é um Desenvolvedor Sênior Especialista em SAP CPI (Cloud Platform Integration) e Groovy. Sua missão é escrever ou ajustar scripts Groovy otimizados, limpos e seguros para fluxos de integração.

Regra de Ouro:
Priorize sempre o código fornecido em "SCRIPT ATUAL" (se houver). Se o usuário pedir um ajuste, modifique esse código em vez de criar um novo do zero, a menos que seja solicitado explicitamente o contrário.

Diretrizes Técnicas Críticas:
1. Manipulação de JSON:
   - Para payloads grandes, use sempre "message.getBody(java.io.Reader)".
   - Para converter Map em JSON, use "JsonOutput.toJson(map)".
   - Ao ler Headers que contêm JSON (Double Encoding), use um bloco try-catch. Tente fazer o parse usando JsonSlurper. Se falhar, verifique se a String está "suja" (ex: envolta em colchetes [] ou com aspas extras) e limpe-a antes de tentar novamente. NUNCA use lógica de substring manual complexa para "desembrulhar" JSON; prefira parse recursivo se necessário.

2. Base64:
   - Use "String.encodeBase64().toString()" para converter Strings em Base64.

3. Merging de Mapas:
   - Para mesclar dois JSONs (ex: um do Header e outro do Body), faça o parse de ambos para Map e use "mapPrincipal.putAll(mapSecundario)". O mapSecundario irá sobrescrever chaves duplicadas, o que é o comportamento esperado de "merge/override".

4. Performance:
   - Para grandes volumes de dados XML, prefira "XmlParser" ou use o Reader com "XmlSlurper".

Instruções de Saída:
- Se houver dúvidas, use a metodologia C.O.A.C.H. para fazer até 3 perguntas de esclarecimento (Contexto, Objetivo, Arquitetura, Constraints, Handoff). NÃO forneça código groovy se fizer perguntas.
- Sempre forneça um payload de exemplo (XML ou JSON) compatível.
- Se o script depende de ler Headers ou Properties, forneça os blocos 'json-headers' e 'json-properties'.

Imports padrão obrigatórios:
import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper
import groovy.xml.XmlParser
import groovy.json.JsonSlurper
import groovy.json.JsonOutput
import groovy.json.JsonBuilder
import java.util.HashMap
import java.util.Map
`;

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('app-lang');
    return (saved as Language) || 'en';
  });
  const [prompt, setPrompt] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [suggestedPayload, setSuggestedPayload] = useState<string | null>(null);
  const [suggestedHeaders, setSuggestedHeaders] = useState<{key: string, value: string}[] | null>(null);
  const [suggestedProperties, setSuggestedProperties] = useState<{key: string, value: string}[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [credits, setCredits] = useState(999);
  const [copySuccess, setCopySuccess] = useState(false);
  const [scriptName, setScriptName] = useState('GeneratedScript');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Execution Panel State
  const [isExecuting, setIsExecuting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline' | 'sleeping'>('checking');
  const [executionResult, setExecutionResult] = useState<{
    status: 'idle' | 'success' | 'error';
    outputPayload: string;
    outputHeaders: string;
    outputProperties: string;
    logs: string;
    errorMessage?: string;
  }>({
    status: 'idle', outputPayload: '', outputHeaders: '', outputProperties: '', logs: ''
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle auth persistence
  useEffect(() => {
    const savedUser = localStorage.getItem('magic_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
    localStorage.setItem('magic_user', JSON.stringify(userData));
    setShowAuthModal(false);
    setView('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('magic_user');
    setView('landing');
  };

  // Resize Handlers for the Workspace
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [editorHeight, setEditorHeight] = useState(55); // 55% for editor, remaining for execution panel
  const [chatInputHeight, setChatInputHeight] = useState(150); // height in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingChatInput, setIsDraggingChatInput] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleVerticalPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingVertical(true);
  };

  const handleChatInputPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingChatInput(true);
  };

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setIsDraggingVertical(false);
    setIsDraggingChatInput(false);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (isDragging && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - container.left) / container.width) * 100;
      
      // Constrain the width between 20% and 80%
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 80) newWidth = 80;
      
      setLeftPanelWidth(newWidth);
    }

    if (isDraggingVertical && editorContainerRef.current && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      let newHeight = ((e.clientY - container.top) / container.height) * 100;

      // Constrain height between 20% and 80%
      if (newHeight < 20) newHeight = 20;
      if (newHeight > 80) newHeight = 80;

      setEditorHeight(newHeight);
    }

    if (isDraggingChatInput && containerRef.current) {
      const container = containerRef.current.getBoundingClientRect();
      let newHeight = container.bottom - e.clientY;

      // Constrain height between 100px and 400px
      if (newHeight < 100) newHeight = 100;
      if (newHeight > 400) newHeight = 400;

      setChatInputHeight(newHeight);
    }
  }, [isDragging, isDraggingVertical, isDraggingChatInput]);

  useEffect(() => {
    if (isDragging || isDraggingVertical || isDraggingChatInput) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, isDraggingVertical, isDraggingChatInput, handlePointerMove, handlePointerUp]);

  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
  }, [lang]);

  // Centralized API Configuration
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
    (window.location.hostname.includes('netlify.app') 
      ? 'https://magic-groovy-backend.koyeb.app' 
      : 'http://localhost:3001');

  // Heartbeat to keep backend awake (every 4 minutes)
  useEffect(() => {
    const ping = async () => {
      try {
        const start = Date.now();
        const response = await fetch(`${API_BASE_URL}/api/health`, {
          // Add a shorter timeout for the health check to detect "sleeping" faster
          signal: AbortSignal.timeout(5000) 
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === 'ok') {
            setBackendStatus('online');
            console.log('Heartbeat sent to backend: ONLINE');
          } else {
            throw new Error('Invalid health check response');
          }
        } else {
          setBackendStatus('offline');
        }
      } catch (e: any) {
        if (e.name === 'TimeoutError' || e.message?.includes('timeout')) {
          setBackendStatus('sleeping');
          console.warn('Heartbeat: Server is likely SLEEPING (timeout)');
        } else {
          setBackendStatus('offline');
          console.warn('Heartbeat failed: OFFLINE', e);
        }
      }
    };

    // Initial ping to wake up the server if it's sleeping
    ping();

    // Set up interval for subsequent pings
    const interval = setInterval(ping, 240000); // 4 minutes
    
    return () => clearInterval(interval);
  }, [API_BASE_URL]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerate = async (targetPrompt?: string, isBackground = false) => {
    const currentPrompt = targetPrompt || prompt;
    if (!currentPrompt.trim()) return;
    
    if (credits <= 0) {
      if (!isBackground) {
        setGeneratedCode(t.dashboard.errors.noCredits);
      }
      return;
    }

    if (!isBackground) {
      setPrompt('');
      setIsGenerating(true);
    } else {
      setIsGeneratingBackground(true);
    }

    // Provide current script as context only for the API call
    const contentWithContext = generatedCode.trim() 
      ? `SCRIPT ATUAL:\n\`\`\`groovy\n${generatedCode}\n\`\`\`\n\nPERGUNTA/AGIUSTE:\n${currentPrompt}`
      : currentPrompt;

    const newMessages = isBackground 
      ? messages 
      : [...messages, { role: 'user' as const, content: currentPrompt }];
    
    if (!isBackground) {
      setMessages(newMessages);
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      const history = newMessages.map((msg, idx) => {
        const isLast = idx === newMessages.length - 1;
        return {
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: isLast ? contentWithContext : msg.content }]
        };
      });

      const result = await (genAI.models.generateContent as any)({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction: `${SYSTEM_PROMPT}\n\nLanguage preference: ${lang}. Please respond in this language.`
        }
      }, { signal: abortControllerRef.current.signal });
      
      const text = result.text;
      console.log("AI Response:", text);
      
      // 1. Extract the Groovy script
      const isModelRequest = currentPrompt.includes('Analise o script Groovy abaixo e gere um payload') || 
                             currentPrompt.includes('Analice el siguiente script de Groovy y genere un payload') || 
                             currentPrompt.includes('Analyze the Groovy script below and generate a sample payload');

      const groovyMatch = text.match(/```(?:groovy)\s*\n([\s\S]*?)```/i);
      if (groovyMatch) {
          // If we find a clear groovy block, we update it regardless (might be an edit)
          setGeneratedCode(groovyMatch[1].trim());
      } else if (!isModelRequest) {
        // ONLY apply fallbacks if this is NOT a request for sample inputs
        // This prevents overwriting the script with headers/properties markdown
        const anyBlockMatches = [...text.matchAll(/```([a-z]*)\s*\n([\s\S]*?)```/gi)];
        const potentialScripts = anyBlockMatches.filter(m => {
           const lang = m[1].toLowerCase();
           return !['xml', 'json', 'html', 'yaml', 'yml', 'json-headers', 'json-properties'].includes(lang);
        });
        
        if (potentialScripts.length > 0) {
           setGeneratedCode(potentialScripts[0][2].trim());
        }
      }

      // 2. Extract the Payload (XML or JSON)
      const payloadBlocks = [...text.matchAll(/```(?:xml|json)\s*\n([\s\S]*?)```/gi)];
      if (payloadBlocks.length > 0) {
        // Take the FIRST payload block found, as it's typically the input example
        const firstPayloadBlock = payloadBlocks[0];
        const extractedPayload = firstPayloadBlock[1].trim();
        console.log("Extracted Payload:", extractedPayload);
        
        // Update suggested payload whenever provided (initial or update)
        setSuggestedPayload(extractedPayload);
      } else {
        // We don't clear suggestedPayload because we want to keep the one from the first turn if valid
      }

      // 3. Extract the Headers (json-headers)
      const headersBlocks = [...text.matchAll(/```json-headers\s*\n([\s\S]*?)```/gi)];
                                      
      if (headersBlocks.length > 0) {
        try {
          const parsed = JSON.parse(headersBlocks[0][1].trim());
          const arr = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
          setSuggestedHeaders(arr);
        } catch (e) {
          console.error("Failed to parse headers", e);
          setSuggestedHeaders(null);
        }
      }

      // 4. Extract the Properties (json-properties)
      const propsBlocks = [...text.matchAll(/```json-properties\s*\n([\s\S]*?)```/gi)];
      if (propsBlocks.length > 0) {
        try {
          const parsed = JSON.parse(propsBlocks[0][1].trim());
          const arr = Object.entries(parsed).map(([k, v]) => ({ key: k, value: String(v) }));
          setSuggestedProperties(arr);
        } catch (e) {
          console.error("Failed to parse properties", e);
          setSuggestedProperties(null);
        }
      }
      
      if (!isBackground) {
        setMessages(prev => [...prev, { role: 'model', content: text }]);
      }
      setCredits(prev => prev - 1);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Generation aborted by user");
        setMessages(prev => [...prev, { role: 'model', content: lang === 'pt' ? '*Geração interrompida pelo usuário*' : lang === 'es' ? '*Generación interrumpida por el usuario*' : '*Generation stopped by user*' }]);
      } else {
        console.error("Generation failed:", error);
        setGeneratedCode(t.dashboard.errors.failed);
      }
    } finally {
      setIsGenerating(false);
      setIsGeneratingBackground(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleFixError = (errorMessage: string, payload: string) => {
    const errorPrompt = 
      (lang === 'pt' ? 'Preciso de ajuda para corrigir um erro neste script Groovy.' : lang === 'es' ? 'Necesito ayuda para corregir un error en este script Groovy.' : 'I need help fixing an error in this Groovy script.') + '\\n\\n' +
      (lang === 'pt' ? '**Mensagem de Erro:**' : lang === 'es' ? '**Mensaje de Error:**' : '**Error Message:**') + '\\n' +
      '\`\`\`\\n' +
      errorMessage + '\\n' +
      '\`\`\`\\n\\n' +
      (lang === 'pt' ? '**Payload de Entrada Utilizado:**' : lang === 'es' ? '**Input Payload Used:**' : '**Input Payload Used:**') + '\\n' +
      '\`\`\`xml\\n' +
      payload + '\\n' +
      '\`\`\`\\n\\n' +
      (lang === 'pt' ? '**Script Atual:**' : lang === 'es' ? '**Current Script:**' : '**Current Script:**') + '\\n' +
      '\`\`\`groovy\\n' +
      generatedCode + '\\n' +
      '\`\`\`\\n\\n' +
      (lang === 'pt' ? 'Por favor, analise o erro, explique o que deu errado e forneça o script Groovy corrigido em um bloco markdown.' : lang === 'es' ? 'Por favor, analice el error, explique qué salió mal y proporcione el script Groovy corregido en un bloque markdown.' : 'Please analyze the error, explain what went wrong, and provide the corrected Groovy script in a markdown block.');



    setPrompt(errorPrompt);
    // Use setTimeout to ensure state is updated before generating
    setTimeout(() => {
        const btn = document.getElementById('generate-btn');
        if (btn) btn.click();
    }, 50);
  };

  const handleGenerateModel = (script: string) => {
    const modelPrompt = 
      (lang === 'pt' ? 'Analise o script Groovy abaixo e gere um payload de exemplo (XML ou JSON), além de quaisquer headers e properties necessários para que ele possa ser testado na execução local.' : 
       lang === 'es' ? 'Analice el siguiente script de Groovy y genere un payload de ejemplo (XML o JSON), además de los encabezados y propiedades necesarios para que pueda probarse localmente.' :
       'Analyze the Groovy script below and generate a sample payload (XML or JSON), as well as any necessary headers and properties so it can be tested locally.') + '\n\n' +
      '```groovy\n' + script + '\n```';
    
    handleGenerate(modelPrompt, true);
  };

  const resetConversation = () => {
    setMessages([]);
    setGeneratedCode('');
    setPrompt('');
    setSuggestedPayload(null);
    setSuggestedHeaders(null);
    setSuggestedProperties(null);
    setScriptName('GeneratedScript');
    setExecutionResult({
      status: 'idle', outputPayload: '', outputHeaders: '', outputProperties: '', logs: ''
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([generatedCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${scriptName}.groovy`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatScript = () => {
    if (!generatedCode) return;
    
    const formatted = beautify.js(generatedCode, {
      indent_size: 4,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      brace_style: 'collapse',
      space_before_conditional: true,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: true,
      wrap_line_length: 0,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false
    });
    
    setGeneratedCode(formatted);
  };

  const highlightWithPrism = (code: string) => {
    return Prism.highlight(code, Prism.languages.groovy, 'groovy');
  };

  const handleRunTest = async (payload: string, headers: {key: string, value: string}[], properties: {key: string, value: string}[]) => {
    setIsExecuting(true);
    setExecutionResult(prev => ({ ...prev, status: 'idle', logs: 'Executing...', errorMessage: '' }));

    // Convert arrays back to objects for the API
    const headersObj = headers.reduce((acc, curr) => {
      if (curr.key.trim()) acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    const propertiesObj = properties.reduce((acc, curr) => {
      if (curr.key.trim()) acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    try {
      const response = await fetch(`${API_BASE_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: generatedCode,
          payload,
          headers: JSON.stringify(headersObj),
          properties: JSON.stringify(propertiesObj),
        }),
      });

      const data = await response.json();

      if (data.status === 'error' || response.status !== 200) {
         setExecutionResult({
            status: 'error',
            outputPayload: '',
            outputHeaders: '',
            outputProperties: '',
            logs: data.logs || '',
            errorMessage: data.errorMessage || data.error || 'Unknown error occurred during execution'
         });
      } else {
         // Success
         setBackendStatus('online');
         setExecutionResult({
            status: 'success',
            outputPayload: data.body || '',
            outputHeaders: JSON.stringify(data.headers || {}, null, 2),
            outputProperties: JSON.stringify(data.properties || {}, null, 2),
            logs: data.logs || '',
         });
      }

    } catch (error: any) {
      const isLocal = API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');
      const errorMsg = isLocal 
        ? `Failed to connect to Local Execution Engine.\nIs the Node.js server running on port 3001?\n\nError: ${error.message}`
        : `Failed to connect to Remote Execution Engine at:\n${API_BASE_URL}\n\nThis usually means the service is still sleeping or the URL is incorrect.\nTry again in a few seconds.\n\nError: ${error.message}`;

      setExecutionResult({
        status: 'error',
        outputPayload: '',
        outputHeaders: '',
        outputProperties: '',
        logs: '',
        errorMessage: errorMsg
      });
      setBackendStatus('offline');
    } finally {
      setIsExecuting(false);
    }
  };

  const LanguageSwitcher = () => (
    <div className="flex items-center space-x-2 bg-vscode-panel border border-vscode-border rounded-lg p-1">
      <Globe className="w-4 h-4 text-vscode-text/40 ml-2" />
      {(['en', 'pt', 'es'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
            lang === l 
              ? 'bg-vscode-blue text-white' 
              : 'text-vscode-text/60 hover:text-vscode-text hover:bg-vscode-bg'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  if (view === 'landing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0D1117] relative overflow-hidden">
        {showAuthModal && (
          <AuthPortal 
            onLogin={handleLogin} 
            apiBaseUrl={API_BASE_URL} 
            onClose={() => setShowAuthModal(false)} 
            lang={lang}
          />
        )}
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-vscode-blue/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="absolute top-6 right-6">
          <LanguageSwitcher />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl text-center space-y-10 relative z-10"
        >
          {/* Logo Section */}
          <div className="flex justify-center">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden flex items-center justify-center bg-transparent shadow-2xl shadow-blue-500/10">
              <img 
                src="/magic_groovy_logo.png" 
                alt="Magic Groovy Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
          
          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="text-gradient-gold">{t.landing.title}</span>{' '}
              <span className="text-gradient-blue">{t.landing.highlight}</span>
            </h1>
            <p className="text-2xl md:text-3xl font-medium text-white/90">
              {t.landing.subtitle}
            </p>
          </div>
          
          {/* Description Section */}
          <p className="max-w-2xl mx-auto text-base md:text-lg text-vscode-text/60 leading-relaxed font-light">
            {(t.landing as any).description}
          </p>
          
          {/* Action Section */}
          <div className="pt-6">
            <button 
              onClick={() => {
                if (!user) setShowAuthModal(true);
                else setView('dashboard');
              }}
              className="btn-premium-glow px-10 py-4 text-lg flex items-center gap-3 mx-auto group"
            >
              {t.landing.getStarted}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Features Section */}
          <div className="pt-20 grid grid-cols-2 gap-12 text-[13px] md:text-sm font-medium text-vscode-text/40 max-w-sm mx-auto">
            <div className="flex flex-col items-center gap-3 group transition-colors hover:text-vscode-text/70">
              <Zap className="w-6 h-6" />
              <span>{t.landing.features.instant}</span>
            </div>
            <div className="flex flex-col items-center gap-3 group transition-colors hover:text-vscode-text/70">
              <Terminal className="w-6 h-6" />
              <span>{t.landing.features.optimized}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-vscode-bg text-vscode-text overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-vscode-border flex items-center justify-between px-6 bg-vscode-panel shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('landing')}>
          <img src="/magic_groovy_logo.png" alt="Logo" className="w-7 h-7 rounded-full object-cover" />
          <span className="font-bold tracking-tight text-vscode-text">{t.dashboard.title}</span>
        </div>
        
        <div className="flex items-center gap-6">
          <LanguageSwitcher />
          <button 
            onClick={resetConversation}
            className="text-sm text-vscode-text/60 hover:text-vscode-blue transition-colors"
          >
            {t.dashboard.newScript}
          </button>
          <div className="flex items-center gap-4 px-3 py-1 bg-vscode-bg rounded border border-vscode-border">
            <div className="flex items-center gap-1.5" title={`Engine Status: ${backendStatus.toUpperCase()}`}>
              <div className={`w-2 h-2 rounded-full ${
                backendStatus === 'online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                backendStatus === 'sleeping' ? 'bg-yellow-500 animate-pulse' :
                backendStatus === 'checking' ? 'bg-blue-400 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="text-[10px] uppercase font-bold tracking-tight opacity-40">Engine</span>
            </div>
            <div className="w-px h-3 bg-vscode-border" />
            <motion.div 
              key={credits}
              initial={{ scale: 1.1, color: '#007ACC' }}
              animate={{ scale: 1, color: credits <= 3 ? '#ef4444' : 'inherit' }}
              className="flex items-center gap-2"
            >
              <CreditCard className={`w-3.5 h-3.5 ${credits <= 3 ? 'text-red-500' : 'text-vscode-blue'}`} />
              <span className="text-xs font-medium">{credits} {t.dashboard.credits}</span>
            </motion.div>
            <motion.button 
              whileHover={{ y: -1 }}
              whileTap={{ y: 1 }}
              className="p-1.5 hover:bg-vscode-border/30 rounded text-vscode-text/30 hover:text-red-400 transition-all ml-1" 
              title={lang === 'pt' ? 'Sair' : lang === 'es' ? 'Salir' : 'Logout'}
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden" ref={containerRef}>
        {/* Main Content Area */}
        <section 
          className="flex-1 flex overflow-hidden relative"
          style={{ userSelect: (isDragging || isDraggingVertical || isDraggingChatInput) ? 'none' : 'auto' }}
        >
          {/* Left: Chat Column */}
          <div 
             className="flex flex-col border-r border-vscode-border bg-vscode-bg/30"
             style={{ width: `${leftPanelWidth}%` }}
          >
            <div className="h-10 border-b border-vscode-border flex items-center px-4 bg-vscode-panel shrink-0">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-vscode-text/40">
                <MessageSquare className="w-3 h-3" />
              </div>
            </div>            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex message-container gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-vscode-blue/10 border-vscode-blue/20 text-vscode-blue' 
                      : 'bg-vscode-panel border-vscode-border text-vscode-text/40'
                  }`}>
                    {msg.role === 'user' ? <MessageSquare className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[85%] p-3 rounded-xl text-sm ${
                    msg.role === 'user' 
                      ? 'chat-bubble-user' 
                      : 'chat-bubble-bot'
                  }`}>
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content.replace(/```(?:groovy|javascript|java|json)?\n?([\s\S]*?)(?:```|$)/gi, '').trim()}
                      </ReactMarkdown>
                    </div>
                    {msg.content.match(/```(?:groovy|javascript|java|json)?/i) && msg.role === 'model' && (
                      <div className="mt-2 pt-2 border-t border-vscode-border/30 text-[10px] opacity-50 italic">
                        {lang === 'pt' ? '(Código atualizado no editor ao lado)' : 
                         lang === 'es' ? '(Código actualizado en el editor al lado)' :
                         '(Code updated in the editor on the right)'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-vscode-panel border border-vscode-border p-3 rounded-lg rounded-tl-none">
                    <Loader2 className="w-4 h-4 animate-spin text-vscode-blue" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Draggable Vertical Handle for Chat Input */}
            <div 
               className="h-1 bg-vscode-border hover:bg-vscode-blue transition-colors cursor-row-resize active:bg-vscode-blue shrink-0 relative flex items-center justify-center -mb-[1px] z-10"
               onPointerDown={handleChatInputPointerDown}
            >
               <div className="h-0.5 w-8 bg-vscode-text/20 rounded" />
            </div>

            {/* Chat Input Area */}
            <div 
              className="p-4 bg-vscode-panel border-t border-vscode-border flex flex-col shrink-0"
              style={{ height: `${chatInputHeight}px` }}
            >
              <div className="relative flex-1 flex flex-col">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t.dashboard.placeholder}
                  className="w-full flex-1 bg-vscode-bg border border-vscode-border rounded-xl pl-4 pr-14 py-3 text-sm text-vscode-text placeholder:text-vscode-text/20 focus:outline-none focus:border-vscode-blue transition-all resize-y custom-scrollbar shadow-inner min-h-[60px]"
                />
                <button 
                  id="generate-btn"
                  onClick={isGenerating ? handleStop : () => handleGenerate()}
                  disabled={(!isGenerating && (!prompt.trim() || credits <= 0))}
                  className={`absolute right-2 bottom-2 p-2.5 rounded-lg transition-all shadow-lg ${
                    isGenerating 
                      ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                      : 'bg-vscode-blue hover:bg-vscode-blue/90 shadow-vscode-blue/20 disabled:opacity-30'
                  }`}
                  title={isGenerating ? t.dashboard.stop : t.dashboard.generate}
                >
                  {isGenerating ? <div className="w-5 h-5 flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-sm" /></div> : <Zap className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-[10px] text-vscode-text/30 text-center flex items-center justify-center gap-4">
                <span><kbd className="px-1 py-0.5 bg-vscode-bg border border-vscode-border rounded text-vscode-blue">Enter</kbd> {t.dashboard.shortcuts.send}</span>
                <span><kbd className="px-1 py-0.5 bg-vscode-bg border border-vscode-border rounded text-vscode-blue">Shift+Enter</kbd> {t.dashboard.shortcuts.newLine}</span>
              </div>
            </div>
          </div>

          {/* Draggable Handle */}
          <div 
             className="w-1.5 bg-vscode-border hover:bg-vscode-blue transition-colors cursor-col-resize active:bg-vscode-blue shrink-0 relative flex items-center justify-center -ml-[1px]"
             onPointerDown={handlePointerDown}
          >
             <div className="w-0.5 h-8 bg-vscode-text/20 rounded z-10" />
          </div>

          {/* Right: Editor Column */}
          <div 
            className="flex flex-col bg-vscode-bg overflow-hidden"
            style={{ width: `${100 - leftPanelWidth}%` }}
          >
            <div 
              ref={editorContainerRef}
              className="flex flex-col bg-vscode-bg overflow-hidden"
              style={{ height: `${editorHeight}%` }}
            >
              <div className="h-10 border-b border-vscode-border flex items-center justify-between px-4 bg-vscode-panel shrink-0">
                <div className="flex items-center gap-2 text-[11px] font-medium text-vscode-blue">
                  <Code2 className="w-3.5 h-3.5" />
                  <div className="flex items-center">
                    {isEditingName ? (
                      <input
                        autoFocus
                        type="text"
                        value={scriptName}
                        onChange={(e) => setScriptName(e.target.value)}
                        onBlur={() => setIsEditingName(false)}
                        onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                        className="bg-vscode-bg border border-vscode-blue/50 rounded px-1.5 py-0.5 text-vscode-text focus:outline-none w-40"
                      />
                    ) : (
                      <span 
                        onClick={() => setIsEditingName(true)}
                        className="text-vscode-text font-semibold cursor-pointer hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1.5"
                      >
                        {scriptName}
                        <span className="opacity-30 font-normal">.groovy</span>
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={formatScript}
                    disabled={!generatedCode}
                    className="p-1.5 hover:bg-vscode-bg rounded transition-colors text-vscode-text/60 hover:text-vscode-blue disabled:opacity-30 flex items-center gap-1.5 text-[10px] font-bold uppercase"
                    title={t.dashboard.tooltips.format}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Format
                  </button>
                  <div className="w-px h-4 bg-vscode-border mx-1" />
                  <button 
                    onClick={copyToClipboard}
                    disabled={!generatedCode}
                    className="p-1.5 hover:bg-vscode-bg rounded transition-colors text-vscode-text/60 hover:text-vscode-blue disabled:opacity-30 flex items-center gap-1.5 text-[10px] font-bold uppercase relative"
                    title={t.dashboard.tooltips.copy}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copySuccess ? 'Copied!' : 'Copy'}
                  </button>
                  <button 
                    onClick={downloadScript}
                    disabled={!generatedCode}
                    className="p-1.5 hover:bg-vscode-bg rounded transition-colors text-vscode-text/60 hover:text-vscode-blue disabled:opacity-30 flex items-center gap-1.5 text-[10px] font-bold uppercase"
                    title={t.dashboard.tooltips.download}
                  >
                    <Download className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
              
              
              <div className="flex-1 overflow-auto custom-scrollbar relative bg-[#1e1e1e]">
              <div className="flex min-h-full relative">
                {!generatedCode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-vscode-text/20 space-y-4 pointer-events-none z-0">
                    <Code2 className="w-12 h-12 opacity-10" />
                    <p className="text-sm tracking-wide uppercase font-bold opacity-30">{t.dashboard.emptyState}</p>
                    <p className="text-[10px] opacity-20">{lang === 'pt' ? '(Cole seu script aqui para começar)' : lang === 'es' ? '(Pegue su script aquí para comenzar)' : '(Paste your script here to start)'}</p>
                  </div>
                )}
                
                {/* Line Numbers */}
                <div className="w-12 bg-[#1e1e1e] border-r border-vscode-border/30 text-right pr-3 pt-5 select-none text-vscode-text/20 font-mono text-xs leading-[21px] z-10">
                  {(generatedCode || '').split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>
                
                <div className="flex-1 z-10">
                  <Editor
                    value={generatedCode}
                    onValueChange={code => setGeneratedCode(code)}
                    highlight={code => highlightWithPrism(code)}
                    padding={20}
                    className="font-mono text-sm text-[#d4d4d4]"
                    style={{
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      fontSize: 13,
                      backgroundColor: 'transparent',
                      minHeight: '100%',
                      lineHeight: '21px'
                    }}
                    textareaClassName="focus:outline-none"
                  />
                </div>
              </div>
            </div>
            </div>

            {/* Draggable Vertical Handle */}
            <div 
               className="h-1.5 bg-vscode-border hover:bg-vscode-blue transition-colors cursor-row-resize active:bg-vscode-blue shrink-0 relative flex items-center justify-center"
               onPointerDown={handleVerticalPointerDown}
            >
               <div className="h-0.5 w-8 bg-vscode-text/20 rounded z-10" />
            </div>

            {/* Execution Environment Panel (Bottom Half) */}
            <div 
              className="flex-1 border-t border-vscode-border bg-[#1e1e1e] overflow-hidden"
              style={{ minHeight: '100px' }}
            >
                <ExecutionPanel 
                  script={generatedCode}
                  suggestedPayload={suggestedPayload}
                  suggestedHeaders={suggestedHeaders}
                  suggestedProperties={suggestedProperties}
                  isExecuting={isExecuting}
                  isGeneratingBackground={isGeneratingBackground}
                  result={executionResult}
                  onRunTest={handleRunTest}
                  onFixError={handleFixError}
                  onGenerateModel={handleGenerateModel}
                  t={t.dashboard}
                />
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
