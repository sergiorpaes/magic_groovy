import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

interface AuthPortalProps {
  onLogin: (user: any) => void;
  apiBaseUrl: string;
  onClose?: () => void;
}

type AuthMode = 'login' | 'register' | 'activate';

export const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin, apiBaseUrl, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setMode('activate');
      setMessage('Conta criada! Por favor, informe o código de ativação enviado por e-mail.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Activation failed');
      setMode('login');
      setMessage('Conta ativada com sucesso! Agora você pode fazer login.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-[#0a0a0b]/60 flex items-center justify-center overflow-hidden z-[1000] backdrop-blur-sm px-4"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <AnimatePresence mode="wait">
        <motion.div 
          key="modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-[#18181b] border border-vscode-border rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' && 'Bem-vindo de volta'}
              {mode === 'register' && 'Crie sua conta'}
              {mode === 'activate' && 'Ativação de conta'}
            </h2>
            <p className="text-gray-400">
              {mode === 'login' && 'Acesse seus scripts e workspace.'}
              {mode === 'register' && 'Junte-se a comunidade de desenvolvedores.'}
              {mode === 'activate' && 'Informe o código enviado ao seu e-mail.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-400 text-sm">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center gap-3 text-green-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              {message}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleActivate} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/40 border border-vscode-border/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-vscode-blue transition-colors"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'register' || mode === 'activate') && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-vscode-border/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-vscode-blue transition-colors"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
            )}

            {mode === 'activate' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Código de Ativação</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-black/40 border border-vscode-border/50 rounded-xl py-3 pl-12 pr-4 text-white font-mono tracking-widest text-center text-lg focus:outline-none focus:border-vscode-blue transition-colors"
                    placeholder="123456"
                    required
                  />
                </div>
              </div>
            )}

            {mode !== 'activate' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-vscode-border/50 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-vscode-blue transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-vscode-blue text-white rounded-xl font-bold mt-4 hover:bg-vscode-blue/90 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar Conta' : 'Ativar Conta'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">
              {mode === 'login' && 'Não tem uma conta?'}
              {mode === 'register' && 'Já tem uma conta?'}
              {mode === 'activate' && 'Não recebeu o código?'}
            </span>
            <button 
              onClick={() => {
                setError(null);
                setMessage(null);
                if (mode === 'login') setMode('register');
                else if (mode === 'register') setMode('login');
                else setMode('register');
              }}
              className="ml-2 text-vscode-blue font-bold hover:underline"
            >
              {mode === 'login' && 'Crie uma agora'}
              {mode === 'register' && 'Fazer login'}
              {mode === 'activate' && 'Registrar novamente'}
            </button>
          </div>

          <button 
            onClick={onClose}
            className="mt-4 w-full text-xs text-vscode-text/40 hover:text-vscode-text/60 transition-colors uppercase font-bold tracking-wider"
          >
            Fechar
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
