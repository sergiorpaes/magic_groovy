
export type Language = 'en' | 'pt' | 'es';

export const translations = {
  en: {
    landing: {
      title: "Magic",
      highlight: "Groovy",
      subtitle: "AI Specialist in Groovy Script",
      description: "Intelligence that transforms logic into code. Magic Groovy combines SAP CPI architect expertise with the power of AI to deliver flawless scripts, eliminating manual errors and accelerating your delivery.",
      getStarted: "Access Assistant",
      features: {
        groovy: "Groovy 2.4+",
        instant: "Instant Generation",
        optimized: "Optimized for CPI"
      }
    },
    dashboard: {
      title: "Magic Groovy",
      newScript: "New Script",
      testScript: "Test Script",
      editorLabel: "Script Editor",
      credits: "Credits",
      recharge: "Recharge",
      promptLabel: "Prompt Input",
      placeholder: "Describe the target script... (e.g. JSON to XML)",
      generate: "Generate Script",
      generating: "Generating...",
      architecting: "Architecting Script...",
      stop: "Stop Generation",
      copied: "Copied!",
      emptyState: "Your generated script will appear here.",
      tooltips: {
        format: "Format Script",
        copy: "Copy to Clipboard",
        download: "Download .groovy"
      },
      shortcuts: {
        send: "to send",
        newLine: "for new line"
      },
      errors: {
        noCredits: "// Error: You have exhausted your credits. Please recharge to continue generating scripts.",
        failed: "// Error: Failed to generate script. Please check your API key."
      },
      confirmGenerateModel: "It looks like you haven't provided any input data (Payload, Headers, or Properties). Would you like the AI to generate a sample model based on your current script?",
      generateSampleModel: "Generate Sample Payload",
      emptyInputTitle: "No Input Data"
    },
    auth: {
      loginTitle: "Welcome back",
      registerTitle: "Create your account",
      activateTitle: "Account Activation",
      loginSubtitle: "Access your scripts and workspace.",
      registerSubtitle: "Join the developer community.",
      activateSubtitle: "Enter the code sent to your email.",
      emailLabel: "Email",
      passwordLabel: "Password",
      nameLabel: "Full Name",
      codeLabel: "Activation Code",
      emailPlaceholder: "your@email.com",
      passwordPlaceholder: "••••••••",
      namePlaceholderText: "Your name",
      codePlaceholder: "123456",
      loginBtn: "Login",
      registerBtn: "Create Account",
      activateBtn: "Activate Account",
      processing: "Processing...",
      noAccount: "Don't have an account?",
      haveAccount: "Already have an account?",
      noCode: "Didn't receive the code?",
      createOne: "Create one now",
      loginNow: "Login now",
      registerAgain: "Register again",
      close: "Close",
      registrationSuccess: "Account created! Please enter the activation code sent by email.",
      activationSuccess: "Account activated successfully! You can now login."
    }
  },
  pt: {
    landing: {
      title: "Magic",
      highlight: "Groovy",
      subtitle: "IA Especialista em Groovy Script",
      description: "A inteligência que transforma lógica em código. O Magic Groovy combina a expertise de um arquiteto SAP CPI com o poder da IA para entregar scripts impecáveis, eliminando erros manuais e acelerando suas entregas.",
      getStarted: "Acessar Assistente",
      features: {
        groovy: "Groovy 2.4+",
        instant: "Geração Instantânea",
        optimized: "Otimizado para CPI"
      }
    },
    dashboard: {
      title: "Magic Groovy",
      newScript: "Novo Script",
      testScript: "Testar Script",
      editorLabel: "Editor de Script",
      credits: "Créditos",
      recharge: "Recarregar",
      promptLabel: "Entrada de Prompt",
      placeholder: "Descreva o script... (ex: JSON para XML)",
      generate: "Gerar Script",
      generating: "Gerando...",
      architecting: "Arquitetando Script...",
      stop: "Parar Geração",
      copied: "Copiado!",
      emptyState: "Seu script gerado aparecerá aqui.",
      tooltips: {
        format: "Formatar Script",
        copy: "Copiar para Área de Transferência",
        download: "Baixar .groovy"
      },
      shortcuts: {
        send: "para enviar",
        newLine: "para nova linha"
      },
      errors: {
        noCredits: "// Erro: Você esgotou seus créditos. Por favor, recarregue para continuar gerando scripts.",
        failed: "// Erro: Falha ao gerar o script. Por favor, verifique sua chave de API."
      },
      confirmGenerateModel: "Parece que você não forneceu nenhum dado de entrada (Payload, Headers ou Properties). Gostaria que a IA gerasse um modelo de exemplo baseado no seu script atual?",
      generateSampleModel: "Gerar Payload de Exemplo",
      emptyInputTitle: "Sem Dados de Entrada"
    },
    auth: {
      loginTitle: "Bem-vindo de volta",
      registerTitle: "Crie sua conta",
      activateTitle: "Ativação de conta",
      loginSubtitle: "Acesse seus scripts e workspace.",
      registerSubtitle: "Junte-se a comunidade de desenvolvedores.",
      activateSubtitle: "Informe o código enviado ao seu e-mail.",
      emailLabel: "E-mail",
      passwordLabel: "Senha",
      nameLabel: "Nome completo",
      codeLabel: "Código de Ativação",
      namePlaceholder: "seu@email.com",
      passwordPlaceholder: "••••••••",
      namePlaceholderText: "Seu nome",
      codePlaceholder: "123456",
      loginBtn: "Entrar",
      registerBtn: "Criar Conta",
      activateBtn: "Ativar Conta",
      processing: "Processando...",
      noAccount: "Não tem uma conta?",
      haveAccount: "Já tem uma conta?",
      noCode: "Não recebeu o código?",
      createOne: "Crie uma agora",
      loginNow: "Fazer login",
      registerAgain: "Registrar novamente",
      close: "Fechar",
      registrationSuccess: "Conta criada! Por favor, informe o código de ativação enviado por e-mail.",
      activationSuccess: "Conta ativada com sucesso! Agora você pode fazer login."
    }
  },
  es: {
    landing: {
      title: "Magic",
      highlight: "Groovy",
      subtitle: "IA Especialista en Groovy Script",
      description: "La inteligencia que transforma la lógica en código. Magic Groovy combina la experiencia de un arquitecto SAP CPI con el poder de la IA para entregar scripts impecables, eliminando errores manuales y acelerando tus entregas.",
      getStarted: "Acceder al Asistente",
      features: {
        groovy: "Groovy 2.4+",
        instant: "Generación Instantánea",
        optimized: "Optimizado para CPI"
      }
    },
    dashboard: {
      title: "Magic Groovy",
      newScript: "Nuevo Script",
      testScript: "Probar Script",
      editorLabel: "Editor de Script",
      credits: "Recargas",
      recharge: "Recargar",
      promptLabel: "Entrada de Prompt",
      placeholder: "Describa el script... (ej: JSON a XML)",
      generate: "Generar Script",
      generating: "Generando...",
      architecting: "Arquitectando Script...",
      stop: "Detener Generación",
      copied: "¡Copiado!",
      emptyState: "Su script generado aparecerá aquí.",
      tooltips: {
        format: "Formatear Script",
        copy: "Copiar al Portapapeles",
        download: "Descargar .groovy"
      },
      shortcuts: {
        send: "para enviar",
        newLine: "para nueva línea"
      },
      errors: {
        noCredits: "// Error: Has agotado tus créditos. Por favor, recarga para continuar generando scripts.",
        failed: "// Error: Falló la generación del script. Por favor, verifique su clave API."
      },
      confirmGenerateModel: "Parece que no ha proporcionado ningún dato de entrada (Payload, Headers o Properties). ¿Le gustaría que la IA generara un modelo de ejemplo basado en su script actual?",
      generateSampleModel: "Gerar Payload de Ejemplo",
      emptyInputTitle: "Sin Datos de Entrada"
    },
    auth: {
      loginTitle: "Bienvenido de nuevo",
      registerTitle: "Crea tu cuenta",
      activateTitle: "Activación de cuenta",
      loginSubtitle: "Acceda a sus scripts y workspace.",
      registerSubtitle: "Únase a la comunidad de desarrolladores.",
      activateSubtitle: "Ingrese el código enviado a su correo electrónico.",
      emailLabel: "Correo electrónico",
      passwordLabel: "Contraseña",
      nameLabel: "Nombre completo",
      codeLabel: "Código de Activación",
      emailPlaceholder: "tu@email.com",
      passwordPlaceholder: "••••••••",
      namePlaceholderText: "Tu nombre",
      codePlaceholder: "123456",
      loginBtn: "Entrar",
      registerBtn: "Crear Cuenta",
      activateBtn: "Activar Cuenta",
      processing: "Procesando...",
      noAccount: "¿No tienes una cuenta?",
      haveAccount: "¿Ya tienes una cuenta?",
      noCode: "¿No recibiste el código?",
      createOne: "Crea una ahora",
      loginNow: "Iniciar sesión",
      registerAgain: "Registrarse de nuevo",
      close: "Cerrar",
      registrationSuccess: "¡Cuenta creada! Por favor, ingrese el código de activación enviado por correo electrónico.",
      activationSuccess: "¡Cuenta activada con éxito! Ahora puede iniciar sesión."
    }
  }
};
