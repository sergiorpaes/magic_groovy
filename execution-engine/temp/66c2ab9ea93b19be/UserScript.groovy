import com.sap.it.api.mapping.*
import java.util.HashMap
import java.util.Map
import com.sap.gateway.ip.core.customdev.util.Message

def Message processData(Message message) {
    
    // Setting the header: if it exists, it will be overwritten; 
    // if not, it will be created.
    message.setHeader("TestHeader", "Processed")
    
    return message
}