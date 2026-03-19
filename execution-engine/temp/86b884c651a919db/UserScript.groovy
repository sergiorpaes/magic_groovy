import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper
import java.util.HashMap

def Message processData(Message message) {
    // 1. Obter o corpo da mensagem (Payload de entrada)
    def body = message.getBody(java.lang.String)
    
    if (!body) {
        message.setBody("")
        return message
    }

    try {
        // 2. Parsear o XML (sem namespaces)
        def root = new XmlSlurper().parseText(body)
        
        // 3. Extrair o valor da tag <nome>
        // O XmlSlurper permite acessar o campo diretamente. 
        // Se o XML for <root><nome>Valor</nome></root>, usamos root.nome
        def nomeExtraido = root.nome.text() ?: ""
        
        // 4. Definir o novo corpo como a String extraída
        message.setBody(nomeExtraido)
        
    } catch (Exception e) {
        // Em caso de erro no parse (XML malformado), retorna vazio conforme solicitado
        message.setBody("")
    }

    return message
}