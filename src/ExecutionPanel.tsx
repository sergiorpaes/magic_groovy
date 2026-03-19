import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Database, List, Settings, TerminalSquare, AlertCircle, Plus, Trash2, GripHorizontal, GripVertical, Wand2, Sparkles, Loader2 } from 'lucide-react';
import beautify from 'js-beautify';

interface ExecutionPanelProps {
  script: string;
  onRunTest: (payload: string, headers: {key: string, value: string}[], properties: {key: string, value: string}[]) => void;
  isExecuting: boolean;
  t: any;
  result: {
    status: 'idle' | 'success' | 'error';
    outputPayload: string;
    outputHeaders: string;
    outputProperties: string;
    logs: string;
    errorMessage?: string;
  };
  suggestedPayload?: string | null;
  suggestedHeaders?: {key: string, value: string}[] | null;
  suggestedProperties?: {key: string, value: string}[] | null;
  onFixError?: (errorMessage: string, payload: string) => void;
  onGenerateModel?: (script: string) => void;
  isGeneratingBackground?: boolean;
}

type TabType = 'payload' | 'headers' | 'properties';

export function ExecutionPanel({ 
  script, 
  onRunTest, 
  isExecuting, 
  isGeneratingBackground,
  t, 
  result, 
  suggestedPayload, 
  suggestedHeaders, 
  suggestedProperties, 
  onFixError, 
  onGenerateModel 
}: ExecutionPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('payload');
  const [inputPayload, setInputPayload] = useState('');
  const [inputHeaders, setInputHeaders] = useState<{key: string, value: string}[]>([]);
  const [inputProperties, setInputProperties] = useState<{key: string, value: string}[]>([]);
  
  // Resize states
  const [inputWidth, setInputWidth] = useState(50); // percentage
  const [consoleHeight, setConsoleHeight] = useState(30); // percentage
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
  const [isDraggingConsole, setIsDraggingConsole] = useState(false);
  const [formattedOutput, setFormattedOutput] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const outputPaneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result.status === 'success' && result.outputPayload) {
      try {
        const parsed = JSON.parse(result.outputPayload);
        setFormattedOutput(JSON.stringify(parsed, null, 2));
      } catch {
        const formatted = beautify.html(result.outputPayload, { indent_size: 2, wrap_line_length: 0 });
        setFormattedOutput(formatted);
      }
    } else {
      setFormattedOutput(null);
    }
  }, [result]);

  const handlePointerDownHorizontal = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingHorizontal(true);
  };

  const handlePointerDownConsole = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingConsole(true);
  };

  const handlePointerUp = useCallback(() => {
    setIsDraggingHorizontal(false);
    setIsDraggingConsole(false);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (isDraggingHorizontal && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 80) newWidth = 80;
      setInputWidth(newWidth);
    }

    if (isDraggingConsole && outputPaneRef.current) {
      const rect = outputPaneRef.current.getBoundingClientRect();
      let newHeight = ((rect.bottom - e.clientY) / rect.height) * 100;
      if (newHeight < 10) newHeight = 10;
      if (newHeight > 70) newHeight = 70;
      setConsoleHeight(newHeight);
    }
  }, [isDraggingHorizontal, isDraggingConsole]);

  useEffect(() => {
    if (isDraggingHorizontal || isDraggingConsole) {
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
  }, [isDraggingHorizontal, isDraggingConsole, handlePointerMove, handlePointerUp]);

  // Handle suggested payload from AI
  useEffect(() => {
    if (suggestedPayload) {
      setInputPayload(suggestedPayload);
      setActiveTab('payload');
    }
  }, [suggestedPayload]);

  // Handle suggested headers from AI
  useEffect(() => {
    if (suggestedHeaders && suggestedHeaders.length > 0) {
      setInputHeaders(suggestedHeaders);
    }
  }, [suggestedHeaders]);

  // Handle suggested properties from AI
  useEffect(() => {
    if (suggestedProperties && suggestedProperties.length > 0) {
      setInputProperties(suggestedProperties);
    }
  }, [suggestedProperties]);

  const handleAddRow = (type: 'headers' | 'properties') => {
    if (type === 'headers') {
      setInputHeaders([...inputHeaders, { key: '', value: '' }]);
    } else {
      setInputProperties([...inputProperties, { key: '', value: '' }]);
    }
  };

  const handleRemoveRow = (type: 'headers' | 'properties', index: number) => {
    if (type === 'headers') {
      setInputHeaders(inputHeaders.filter((_, i) => i !== index));
    } else {
      setInputProperties(inputProperties.filter((_, i) => i !== index));
    }
  };

  const handleChangeRow = (type: 'headers' | 'properties', index: number, field: 'key' | 'value', val: string) => {
    if (type === 'headers') {
      const newHeaders = [...inputHeaders];
      newHeaders[index][field] = val;
      setInputHeaders(newHeaders);
    } else {
      const newProps = [...inputProperties];
      newProps[index][field] = val;
      setInputProperties(newProps);
    }
  };

  const handleFormatInput = () => {
    if (!inputPayload) return;
    try {
      const parsed = JSON.parse(inputPayload);
      setInputPayload(JSON.stringify(parsed, null, 2));
    } catch {
      const formatted = beautify.html(inputPayload, { indent_size: 2, wrap_line_length: 0 });
      setInputPayload(formatted);
    }
  };

  const handleFormatOutput = () => {
    if (!result.outputPayload) return;
    try {
      const parsed = JSON.parse(result.outputPayload);
      setFormattedOutput(JSON.stringify(parsed, null, 2));
    } catch {
      const formatted = beautify.html(result.outputPayload, { indent_size: 2, wrap_line_length: 0 });
      setFormattedOutput(formatted);
    }
  };

  const handleRunTest = () => {
    onRunTest(inputPayload, inputHeaders, inputProperties);
  };

  const navItems = [
    { id: 'payload', label: 'Body Payload', icon: Database },
    { id: 'headers', label: 'Headers', icon: List },
    { id: 'properties', label: 'Properties', icon: Settings },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-vscode-text overflow-hidden" ref={containerRef}>
      {/* Header & Run Action */}
      <div className="h-10 border-b border-vscode-border flex items-center justify-between px-4 bg-vscode-panel shrink-0">
        <div className="flex items-center gap-2 text-[11px] font-medium text-vscode-blue">
          <TerminalSquare className="w-3.5 h-3.5" />
          <span className="text-vscode-text font-semibold uppercase tracking-wider">{t.testScript}</span>
        </div>
        
        <button 
          onClick={handleRunTest}
          disabled={!script || isExecuting}
          className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 disabled:bg-gray-600 flex items-center gap-1.5"
        >
          {isExecuting ? (
             <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          Run Script
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative" style={{ userSelect: (isDraggingHorizontal || isDraggingConsole) ? 'none' : 'auto' }}>
        {/* INPUT PANE */}
        <div 
          className="flex flex-col border-r border-vscode-border/50 min-h-0"
          style={{ width: `${inputWidth}%` }}
        >
           <div className="p-2 bg-[#252526] text-[10px] font-bold uppercase tracking-widest text-vscode-text/50 border-b border-vscode-border/50 flex justify-between items-center h-9">
             <span>Input Data</span>
             <button
                onClick={() => onGenerateModel?.(script)}
                disabled={!script.trim()}
                className="flex items-center gap-1.5 text-vscode-blue hover:text-white transition-colors uppercase font-bold text-[9px] disabled:opacity-30 disabled:pointer-events-none"
                title={t.generateSampleModel}
             >
               {isGeneratingBackground ? (
                 <Loader2 className="w-3 h-3 animate-spin" />
               ) : (
                 <Sparkles className="w-3 h-3" />
               )}
               {isGeneratingBackground ? "..." : t.generateSampleModel}
             </button>
           </div>
           
           {/* Navigation Tabs */}
           <div className="flex bg-[#252526] border-b border-vscode-border/50 pr-3 items-center">
             <div className="flex overflow-x-auto no-scrollbar">
               {navItems.map(item => (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id)}
                   className={`px-4 py-1.5 text-[10px] font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                     activeTab === item.id 
                       ? 'border-vscode-blue text-vscode-blue bg-[#1e1e1e]' 
                       : 'border-transparent text-vscode-text/60 hover:text-vscode-text hover:bg-[#2d2d2d]'
                   }`}
                 >
                   <item.icon className="w-3 h-3" />
                   {item.label}
                 </button>
               ))}
             </div>
             <div className="flex-1" />
             {activeTab === 'payload' && inputPayload.trim() && (
               <button 
                 onClick={handleFormatInput} 
                 className="flex items-center gap-1.5 text-[10px] text-vscode-blue hover:text-white transition-colors uppercase font-bold shrink-0 ml-3"
                 title="Format Payload"
               >
                 <Wand2 className="w-3 h-3" />
                 Format
               </button>
             )}
           </div>

           {/* Input Editor or Table */}
            <div className="flex-1 p-2 overflow-auto custom-scrollbar">
              {activeTab === 'payload' ? (
                 <textarea 
                   className="w-full h-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs resize-none focus:outline-none placeholder:text-vscode-text/20 leading-relaxed"
                   value={inputPayload}
                   onChange={(e) => setInputPayload(e.target.value)}
                   placeholder="Enter JSON or XML Payload..."
                 />
              ) : (
                <div className="flex flex-col gap-2 p-2">
                  <button 
                    onClick={() => handleAddRow(activeTab)}
                    className="w-full py-2 border border-green-600/50 text-green-500 hover:bg-green-600/10 rounded flex items-center justify-center gap-2 text-[10px] font-bold uppercase transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add {activeTab === 'headers' ? 'Header' : 'Property'}
                  </button>
                  
                  <div className="space-y-2 mt-2">
                    {(activeTab === 'headers' ? inputHeaders : inputProperties).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input 
                          type="text"
                          value={item.key}
                          onChange={(e) => handleChangeRow(activeTab, idx, 'key', e.target.value)}
                          placeholder="Key"
                          className="flex-1 bg-[#1e1e1e] border border-vscode-border/50 rounded px-2 py-1.5 text-xs text-[#d4d4d4] focus:outline-none focus:border-vscode-blue"
                        />
                        <input 
                          type="text"
                          value={item.value}
                          onChange={(e) => handleChangeRow(activeTab, idx, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 bg-[#1e1e1e] border border-vscode-border/50 rounded px-2 py-1.5 text-xs text-[#d4d4d4] focus:outline-none focus:border-vscode-blue"
                        />
                        <button 
                          onClick={() => handleRemoveRow(activeTab, idx)}
                          className="p-1.5 border border-red-500/50 text-red-500 hover:bg-red-500/10 rounded transition-colors uppercase text-[10px] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {(activeTab === 'headers' ? inputHeaders : inputProperties).length === 0 && (
                      <div className="text-center text-xs text-vscode-text/30 py-4 italic">
                        No {activeTab} defined.
                      </div>
                    )}
                  </div>
                </div>
             )}
           </div>
        </div>

        {/* Draggable Vertical (Horizontal Resize) Handle */}
        <div 
           className="w-1.5 bg-vscode-border hover:bg-vscode-blue transition-colors cursor-col-resize active:bg-vscode-blue shrink-0 relative flex items-center justify-center -mx-[1px] z-10"
           onPointerDown={handlePointerDownHorizontal}
        >
           <div className="w-0.5 h-8 bg-vscode-text/20 rounded" />
        </div>

        {/* OUTPUT PANE */}
        <div 
          ref={outputPaneRef}
          className="flex-1 flex flex-col bg-[#1a1a1a] min-h-0"
        >
           <div className="p-2 bg-[#252526] text-[10px] font-bold uppercase tracking-widest text-[#4CAF50] border-b border-vscode-border/50 flex items-center justify-between h-9">
             <div className="flex items-center gap-2">
               <span>Execution Result</span>
               {result.status === 'success' && <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">SUCCESS</span>}
               {result.status === 'error' && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3"/> ERROR</span>}
             </div>
           </div>

           <div className="flex-1 flex flex-col min-h-0 relative">
             {result.status === 'idle' ? (
               <div className="flex-1 flex items-center justify-center text-vscode-text/20 text-xs font-medium uppercase tracking-widest">
                  No Execution Yet
               </div>
             ) : (
               <div className="flex-1 flex flex-col overflow-hidden">
                  {result.status === 'error' ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-vscode-text/30 text-xs text-center p-6 gap-2">
                      <AlertCircle className="w-10 h-10 opacity-10" />
                      <p className="max-w-[250px] leading-relaxed">
                        Execution failed. See the <span className="text-vscode-text/50 font-bold">Console Logs</span> panel below for error details.
                      </p>
                    </div>
                  ) : (
                   <>
                     {/* Output Tabs (Mirroring active input tab for side-by-side comparison feeling) */}
                     <div className="flex bg-[#252526] border-b border-vscode-border/50 pr-3 items-center">
                       <div className="flex overflow-x-auto no-scrollbar">
                         {navItems.map(item => (
                           <button
                             key={item.id}
                             onClick={() => setActiveTab(item.id)}
                             className={`px-4 py-1.5 text-[10px] font-semibold flex items-center justify-center border-b-2 transition-colors whitespace-nowrap ${
                               activeTab === item.id 
                                 ? 'border-green-500 text-green-400 bg-[#1a1a1a]' 
                                 : 'border-transparent text-vscode-text/40 hover:text-vscode-text/60'
                             }`}
                           >
                             {item.label}
                           </button>
                         ))}
                       </div>
                       <div className="flex-1" />
                       {activeTab === 'payload' && result.status === 'success' && (formattedOutput || result.outputPayload)?.trim() && (
                          <button 
                            onClick={handleFormatOutput} 
                            className="flex items-center gap-1.5 text-[10px] text-vscode-blue hover:text-white transition-colors uppercase font-bold shrink-0 ml-3"
                            title="Format Output Payload"
                          >
                            <Wand2 className="w-3 h-3" />
                            Format
                          </button>
                        )}
                     </div>

                     
                     <div className="flex-1 p-3 text-[#d4d4d4] font-mono text-xs overflow-auto custom-scrollbar">
                       {activeTab === 'payload' ? (
                         <pre className="whitespace-pre-wrap leading-relaxed">
                           {formattedOutput ?? result.outputPayload}
                         </pre>
                       ) : (
                         <table className="w-full text-left border-collapse">
                           <thead className="bg-[#2d2d2d] sticky top-0 border-b border-[#3e3e42]">
                             <tr>
                               <th className="p-2 font-semibold text-vscode-text/70 w-1/3">Key</th>
                               <th className="p-2 font-semibold text-vscode-text/70">Value</th>
                             </tr>
                           </thead>
                           <tbody>
                             {(() => {
                               const dataString = activeTab === 'headers' ? result.outputHeaders : result.outputProperties;
                               if (!dataString || dataString === '{}') return <tr><td colSpan={2} className="p-4 text-center text-vscode-text/30 italic">No {activeTab} returned.</td></tr>;
                               
                               try {
                                 let dataObj = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
                                 if (typeof dataObj === 'string') dataObj = JSON.parse(dataObj);
                                 const entries = Object.entries(dataObj);
                                 if (entries.length === 0) return <tr><td colSpan={2} className="p-4 text-center text-vscode-text/30 italic">Empty</td></tr>;
                                 return entries.map(([k, v], i) => (
                                   <tr key={i} className="hover:bg-[#2a2d2e] transition-colors border-b border-[#3e3e42]/50">
                                     <td className="p-2 border-r border-[#3e3e42]/50 font-mono text-[#9cdcfe] break-all">{k}</td>
                                     <td className="p-2 font-mono text-[#ce9178] break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
                                   </tr>
                                 ));
                               } catch (e) {
                                 return (
                                   <tr>
                                     <td colSpan={2} className="p-2 text-red-400 whitespace-pre-wrap">{String(dataString)}</td>
                                   </tr>
                                 );
                               }
                             })()}
                           </tbody>
                         </table>
                       )}
                     </div>
                   </>
                 )}
               </div>
             )}

             {/* Draggable Horizontal (Vertical Resize) Handle for Logs */}
             <div 
                className="h-1.5 bg-vscode-border hover:bg-vscode-blue transition-colors cursor-row-resize active:bg-vscode-blue shrink-0 relative flex items-center justify-center z-10"
                onPointerDown={handlePointerDownConsole}
             >
                <div className="h-0.5 w-8 bg-vscode-text/20 rounded" />
             </div>

             {/* Console Logs Panel at the bottom */}
             <div 
               className="border-t border-vscode-border/50 bg-black flex flex-col shrink-0"
               style={{ height: `${consoleHeight}%`, minHeight: '40px' }}
             >
               <div className="px-3 py-1 bg-[#252526] text-[10px] font-bold uppercase text-vscode-text/40 flex items-center justify-between shrink-0">
                 <span>Console Logs (messageLog)</span>
               </div>
               <div className="flex-1 p-2 overflow-auto custom-scrollbar text-gray-400 font-mono text-[11px] whitespace-pre-wrap">
                 {result.status === 'error' ? (
                   <span className="text-red-400">
                     {result.errorMessage}
                     {result.logs && `\n\n--- Console Output ---\n${result.logs}`}
                   </span>
                 ) : (
                   result.logs || 'No logs generated.'
                 )}
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
