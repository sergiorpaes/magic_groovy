
import com.sap.gateway.ip.core.customdev.util.Message;
import groovy.json.JsonSlurper;
import groovy.json.JsonOutput;

def message = new Message();

// Parse Input
def jsonSlurper = new JsonSlurper()
def inputPayload = """${'''<root>
    <orderId>98765</orderId>
    <customer>
        <name>João Silva</name>
        <email>joao@exemplo.com.br</email>
    </customer>
    <items>
        <item>
            <product>Notebook</product>
            <quantity>1</quantity>
            <price>4500.00</price>
        </item>
        <item>
            <product>Mouse Sem Fio</product>
            <quantity>2</quantity>
            <price>150.00</price>
        </item>
    </items>
</root>'''}"""
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
    println JsonOutput.toJson([status: 'error', errorMessage: e.getMessage()])
    println "===RESULT_END==="
}
