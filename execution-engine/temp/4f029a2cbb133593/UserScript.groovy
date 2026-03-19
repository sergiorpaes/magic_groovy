import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.xml.MarkupBuilder

def Message processData(Message message) {
    // 1. Recuperar o corpo da mensagem (Payload JSON)
    def body = message.getBody(java.lang.String)
    if (!body) return message

    // 2. Parse do JSON
    def jsonSlurper = new JsonSlurper()
    def listRecords = jsonSlurper.parseText(body)

    // 3. Preparar o Writer para construir o XML de saída
    def writer = new StringWriter()
    def xmlBuilder = new MarkupBuilder(writer)

    // 4. Início da construção do XML
    xmlBuilder.root {
        // Iterar sobre a lista de records do JSON
        listRecords.records.each { record ->
            
            // Lógica PERNR: Valor original acrescentando 'Z' na frente
            def pernrOriginal = record.PERNR ?: ""
            def pernrTransformed = "Z" + pernrOriginal
            
            // Lógica APUID: Substring dos 3 primeiros caracteres + padding de zeros se necessário
            def apuidOriginal = record.APUID ?: ""
            // padRight garante que tenha ao menos 3 caracteres preenchendo com '0'
            def apuidTransformed = apuidOriginal.padRight(3, '0').substring(0, 3)
            
            // Lógica MYID: Concatenar os valores JÁ TRANSFORMADOS (conforme solicitado)
            def myidTransformed = pernrTransformed + apuidTransformed

            // Criar a estrutura do nó de registro no XML
            record {
                PERNR(pernrTransformed)
                APUID(apuidTransformed)
                MYID(myidTransformed)
            }
        }
    }

    // 5. Definir o novo payload como XML e configurar o Content-Type
    message.setBody(writer.toString())
    message.setHeader("Content-Type", "application/xml")

    return message
}