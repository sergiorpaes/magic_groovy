
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
    }
  }
};
