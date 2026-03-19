import com.sap.it.api.mapping.*
import java.util.HashMap
import java.util.Map
import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.xml.StreamingMarkupBuilder
import groovy.xml.XmlUtil

def Message processData(Message message) {
    // 1. Obter o corpo da mensagem (JSON)
    def body = message.getBody(java.lang.String)
    if (!body) return message

    // 2. Parse do JSON
    def jsonParser = new JsonSlurper()
    def input = jsonParser.parseText(body)

    // 3. Definição do Builder para criar o XML
    def xmlBuilder = new StreamingMarkupBuilder()
    xmlBuilder.encoding = "UTF-8"

    def resultXml = xmlBuilder.bind {
        // Tag Raiz
        Root {
            // Iterar sobre o array "records"
            input.records.each { record ->
                
                // Lógica de tratamento de nulos: se o campo não existir ou for nulo, assume "0"
                def rawPernr = record.PERNR ?: "0"
                def rawNome = record.Nome ?: "0"
                def rawCodFuncao = record.Código_Função ?: "0"
                def rawFuncao = record.Função ?: "0"

                Employee {
                    // Campo PERNR: acrescenta 'Z' na frente (se for "0", mantemos conforme regra de nulo ou aplicamos o Z?)
                    // Aplicando a regra: se não for nulo, Z + valor. Se for nulo, apenas "0".
                    PERNR(rawPernr == "0" ? "0" : "Z" + rawPernr)

                    // Campo Nome: transformar em caixa alta
                    Nome(rawNome.toString().toUpperCase())

                    // Campo Função: Concatenação [Código] | [Função]
                    // Se ambos forem "0", o resultado será "0 | 0" conforme a regra de nulos informada
                    Funcao(rawCodFuncao.toString() + " | " + rawFuncao.toString())
                }
            }
        }
    }

    // 4. Converter o objeto Writable do builder para String formatada e salvar no corpo
    message.setBody(XmlUtil.serialize(resultXml))

    // 5. Ajustar o Content-Type para XML
    message.setHeader("Content-Type", "application/xml")

    return message
}