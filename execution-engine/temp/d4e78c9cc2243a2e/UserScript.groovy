import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper
import java.util.HashMap

def Message processData(Message message) {
    try {
        // 1. Obter o corpo da mensagem (XML) como String
        def body = message.getBody(java.lang.String)
        
        if (!body) {
            return message // Retorna se o body estiver vazio
        }

        // 2. Parse do XML utilizando XmlSlurper
        // O método .find { it.name() == 'nome' } busca a tag em qualquer profundidade
        def xml = new XmlSlurper().parseText(body)
        
        // Busca o valor da tag <nome> recursivamente
        def nomeValue = xml.'**'.find { it.name() == 'nome' }?.text()

        // 3. Atualizar o Body da mensagem
        // Se encontrar o nome, coloca no body, caso contrário, deixa vazio ou trata
        if (nomeValue) {
            message.setBody(nomeValue)
        } else {
            message.setBody("Tag <nome> não encontrada no XML")
        }

    } catch (Exception e) {
        // Tratamento de erro básico para evitar parada inesperada do iFlow
        throw new Exception("Erro ao processar XML: " + e.getMessage())
    }

    return message
}