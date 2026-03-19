import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.it.api.mapping.*
import java.util.HashMap
import java.util.Map
import groovy.json.JsonSlurper
import groovy.xml.MarkupBuilder

def Message processData(Message message) {
    // 1. Obter o corpo da mensagem (JSON)
    def body = message.getBody(java.lang.String)
    if (!body) return message

    // 2. Parse do JSON
    def jsonSlurper = new JsonSlurper()
    def input = jsonSlurper.parseText(body)

    // 3. Preparar o Writer para o XML de saída
    def writer = new StringWriter()
    def xml = new MarkupBuilder(writer)

    // 4. Construção do XML com as lógicas solicitadas
    xml.Root { // Tag raiz genérica
        input.records.each { record ->
            
            // Lógica PERNR: Acrescentar 'Z' na frente
            def varPernr = "Z" + (record.PERNR ?: "")
            
            // Lógica APUID: Pegar apenas os 3 primeiros caracteres (Safe Substring)
            def varApuid = (record.APUID ?: "").toString().take(3)
            
            // Lógica MYID: Concatenar os dois últimos campos (PERNR + APUID originais)
            def varMyid = (record.PERNR ?: "") + (record.APUID ?: "")

            Record {
                PERNR(varPernr)
                APUID(varApuid)
                MYID(varMyid)
            }
        }
    }

    // 5. Definir o novo payload no corpo da mensagem
    message.setBody(writer.toString())
    
    // Opcional: Definir o Content-Type para XML
    message.setHeader("Content-Type", "application/xml")

    return message
}