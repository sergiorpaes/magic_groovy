import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.it.api.msglog.MessageLogFactory
import java.util.HashMap

def Message processData(Message message) {
    // 1. Get the payload as a String with UTF-8 encoding
    def body = message.getBody(java.lang.String)
    
    // 2. Set the 'TestHeader' with the value 'Success'
    message.setHeader("TestHeader", "Success")
    
    // 3. Create an MPL Attachment to "print" the payload in the monitoring dashboard
    def messageLog = MessageLogFactory.getMessageLog(message)
    if (messageLog != null) {
        // addAttachmentAsString(Name, Content, MimeType)
        messageLog.addAttachmentAsString("Payload_Log", body, "text/xml")
    }
    
    return message
}