
import com.sap.gateway.ip.core.customdev.util.Message;
import groovy.json.JsonSlurper;
import groovy.json.JsonOutput;

def message = new Message();

// Parse Input
def jsonSlurper = new JsonSlurper()
def inputPayload = """${'''<root>
  <test>123</test>
</root>{ "name": "Jetski", "status": "active" }'''}"""
def inputHeaders = jsonSlurper.parseText('''{}''')
def inputProperties = jsonSlurper.parseText('''{}''')

message.setBody(inputPayload);
inputHeaders.each { k, v -> message.setHeader(k, v) }
inputProperties.each { k, v -> message.setProperty(k, v) }

// User script is executed by evaluating the file and then calling processData
File sourceFile = new File("UserScript.groovy")
Class scriptClass = new GroovyClassLoader().parseClass(sourceFile)
GroovyObject scriptInstance = (GroovyObject) scriptClass.newInstance()

try {
  // Capture System.out (console logs)
  def baos = new ByteArrayOutputStream()
  def ps = new PrintStream(baos)
  def old = System.out
  System.setOut(ps)

  message = scriptInstance.processData(message)

  System.out.flush()
  System.setOut(old)
  def logs = baos.toString()

  def result = [
    status: 'success',
    body: message.getBody().toString(),
    headers: message.getHeaders(),
    properties: message.getProperties(),
    logs: logs
  ]
  println "===RESULT_START==="
  println JsonOutput.toJson(result)
  println "===RESULT_END==="

} catch (Throwable e) {
    println "===RESULT_START==="
    println JsonOutput.toJson([status: 'error', errorMessage: e.getMessage() + "\n" + e.getStackTrace()?.join("\n")])
    println "===RESULT_END==="
}
