import com.sap.gateway.ip.core.customdev.util.Message
import groovy.json.JsonSlurper
import groovy.xml.MarkupBuilder

def Message processData(Message message) {
    // 1. Get the payload from the message body
    def body = message.getBody(java.lang.String)
    if (!body) return message

    // 2. Parse JSON string into an object
    def jsonSlurper = new JsonSlurper()
    def jsonObject = jsonSlurper.parseText(body)

    // 3. Initialize StringWriter and MarkupBuilder to construct XML
    def writer = new StringWriter()
    def xmlBuilder = new MarkupBuilder(writer)

    // 4. Create the XML structure starting with the Root element
    xmlBuilder.Root {
        // We iterate over the top-level JSON object
        buildXml(xmlBuilder, jsonObject)
    }

    // 5. Set the transformed XML back to the message body
    message.setBody(writer.toString())
    
    // Set Content-Type header to XML
    message.setHeader("Content-Type", "application/xml")

    return message
}

/**
 * Recursive method to handle nested objects and arrays
 */
def buildXml(builder, data) {
    if (data instanceof Map) {
        data.each { key, value ->
            if (value instanceof List) {
                // For arrays: use the property name as the tag for each element
                value.each { item ->
                    builder."${key}" {
                        buildXml(builder, item)
                    }
                }
            } else if (value instanceof Map) {
                // For objects: create a nested tag
                builder."${key}" {
                    buildXml(builder, value)
                }
            } else {
                // For simple values: create a tag with the value
                builder."${key}"(value != null ? value.toString() : "")
            }
        }
    } else if (data != null) {
        // Fallback for simple values if the input isn't a Map/List at this level
        builder.yield data.toString()
    }
}