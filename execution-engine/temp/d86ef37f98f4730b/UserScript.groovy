import com.sap.gateway.ip.core.customdev.util.Message
import groovy.xml.XmlSlurper

def Message processData(Message message) {
    def body = message.getBody(java.lang.String)
        def xml = new XmlSlurper().parseText(body)
            message.setBody("Parsed: " + xml.NAME.text())
                return message
                }