import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper
import groovy.json.JsonOutput

def Message processData(Message message) {
    // 1. Obter o corpo da mensagem (Payload XML)
    def body = message.getBody(java.lang.String)
    
    if (!body) {
        return message // Retorna se o corpo estiver vazio
    }

    // 2. Parsear o XML usando XmlSlurper
    // Usamos o 'declareNamespace' se houvesse, mas como não há, o acesso é direto
    def xml = new XmlSlurper().parseText(body)

    // 3. Extração de dados (Exemplo: Lendo campos de um pedido)
    // Supondo uma estrutura <root><orderId>123</orderId><items><item>...</item></items></root>
    def orderId = xml.orderId.text()
    def customerName = xml.customer.name.text()
    
    // 4. Exemplo de iteração sobre uma lista de itens
    def listaItens = []
    xml.items.item.each { node ->
        listaItens << [
            produto: node.product.text(),
            quantidade: node.quantity.text(),
            preco: node.price.toBigDecimal()
        ]
    }

    // 5. Armazenar um valor em uma Property do CPI para uso posterior no fluxo
    message.setProperty("P_OrderId", orderId)

    // 6. Criar um mapa para converter em JSON (apenas para demonstrar o parse)
    def outputMap = [
        identificador: orderId,
        cliente: customerName,
        itens_processados: listaItens,
        status: "Sucesso"
    ]

    // 7. Definir o novo corpo da mensagem como JSON
    message.setBody(JsonOutput.toJson(outputMap))
    
    // Definir o Content-Type para JSON
    message.setHeader("Content-Type", "application/json")

    return message
}