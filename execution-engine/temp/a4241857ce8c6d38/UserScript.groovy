import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper
import groovy.json.JsonOutput
import java.util.HashMap

def Message processData(Message message) {
    // 1. Obter o corpo da mensagem (XML)
    def body = message.getBody(java.lang.String)
    if (!body) return message

    try {
        // 2. Parse do XML
        def xml = new XmlSlurper().parseText(body)
        def Map<String, Object> numericFields = [:]

        // 3. Iterar sobre todos os nós filhos do root <OUTPUT>
        xml.children().each { node ->
            def value = node.text().trim()
            
            // Regex para validar se é um número (Inteiro ou Decimal com ponto)
            // Aceita: 123, 123.45, 0.00, etc.
            if (value ==~ /^-?\d+(\.\d+)?$/) {
                // Converter para BigDecimal para preservar precisão decimal no JSON
                numericFields.put(node.name(), value.toBigDecimal())
            }
        }

        // 4. Converter o Map resultante para JSON
        def jsonOutput = JsonOutput.toJson(numericFields)
        
        // 5. Opcional: Formatar o JSON (Pretty Print) - Remova se preferir minificado
        // jsonOutput = JsonOutput.prettyPrint(jsonOutput)

        // 6. Atualizar o payload e definir o Content-Type
        message.setBody(jsonOutput)
        message.setHeader("Content-Type", "application/json")

    } catch (Exception e) {
        throw new Exception("Erro ao processar conversão XML para JSON: " + e.getMessage())
    }

    return message
}