const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const TEMP_DIR = path.join(__dirname, 'temp');

// Check Java availability
try {
  const { execSync } = require('child_process');
  console.log('Checking Java availability...');
  execSync('java -version');
  console.log('Java is available in PATH.');
} catch (e) {
  console.error('CRITICAL: Java was NOT found in the system PATH.');
}

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Path Sanitize Utility
const sanitizeResult = (text) => {
  if (!text || typeof text !== 'string') return text;
  
  // Create a regex that matches the absolute path to any execution directory
  // Example matches: /app/temp/abc123def/ or C:\app\temp\abc123def\
  const escapedTempDir = TEMP_DIR.replace(/\\/g, '[\\\\/]');
  const regex = new RegExp(escapedTempDir + '[\\\\/][a-f0-9]+[\\\\/]?', 'gi');
  
  const separator = process.platform === 'win32' ? '\\' : '/';
  return text.replace(regex, `[MagicGroovy]${separator}`);
};

// Mock CPI Message Class (Simplified)
const mockMessageClass = `
package com.sap.gateway.ip.core.customdev.util;

import java.util.HashMap;
import java.util.Map;

public class Message {
    def body
    def headers = [:]
    def properties = [:]

    def getBody() { body }
    def getBody(type) { body }
    void setBody(val) { body = val }
    
    def getHeader(name) { headers[name] }
    def getHeader(name, type) { headers[name] }
    void setHeader(name, val) { headers[name] = val }
    def getHeaders() { headers }

    def getProperty(name) { properties[name] }
    def getProperty(name, type) { properties[name] }
    void setProperty(name, val) { properties[name] = val }
    def getProperties() { properties }
}
`;

// Mock SAP Mapping Package
const mockMappingClass = `
package com.sap.it.api.mapping;
public class MappingContext {
    public String getHeader(String name) { return ""; }
    public String getProperty(String name) { return ""; }
}
`;

// Health check endpoint to keep the service awake
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/execute', async (req, res) => {
  const { script, payload, headers, properties } = req.body;

  if (!script) {
    return res.status(400).json({ error: 'Script is required' });
  }

  const executionId = crypto.randomBytes(8).toString('hex');
  const executionDir = path.join(TEMP_DIR, executionId);
  fs.mkdirSync(executionDir);

  try {
    // 2. Write the user's script
    const scriptPath = path.join(executionDir, 'UserScript.groovy');
    fs.writeFileSync(scriptPath, script);

    // 3. Create the Runner Script that glues everything together
    // Optimized: Classes are defined directly to avoid multiple parseClass calls
    // 3. Create the Runner Script that glues everything together
    const runnerScript = `
import groovy.json.JsonSlurper
import groovy.json.JsonOutput

// Use a unified ClassLoader
def gcl = new GroovyClassLoader(this.class.classLoader)

// 1. Define Mock Classes as strings
def messageSource = """
package com.sap.gateway.ip.core.customdev.util
import java.util.HashMap
import java.util.Map

public class Message {
    private Object _body
    private Map _hdrs = [:]
    private Map _props = [:]

    void setBody(Object v) { _body = v }
    Object getBody() { _body }
    Object getBody(Class t) { _body }
    
    void setHeader(String n, Object v) { _hdrs[n] = v }
    Object getHeader(String n) { _hdrs[n] }
    Object getHeader(String n, Class t) { _hdrs[n] }
    Map getHeaders() { _hdrs }

    void setProperty(String n, Object v) { _props[n] = v }
    Object getProperty(String n) { _props[n] }
    Object getProperty(String n, Class t) { _props[n] }
    Map getProperties() { _props }
    
    void removeHeader(String n) { _hdrs.remove(n) }
}
"""

def mappingSource = """
package com.sap.it.api.mapping
public class MappingContext {
    public String getHeader(String name) { return "" }
    public String getProperty(String name) { return "" }
}
"""

gcl.parseClass(messageSource)
gcl.parseClass(mappingSource)

def baos = new ByteArrayOutputStream()
def ps = new PrintStream(baos)
def old = System.out
def message = null

try {
  System.setOut(ps)
  
  // 2. Load User Script - File path handling for Linux/Windows
  def userScriptFile = new File("runner.groovy").parentFile == null ? new File("UserScript.groovy") : new File(new File("runner.groovy").parentFile, "UserScript.groovy")
  def userScriptClass = gcl.parseClass(userScriptFile)
  def scriptInstance = userScriptClass.newInstance()
  
  // 3. Instantiate Message
  message = gcl.loadClass("com.sap.gateway.ip.core.customdev.util.Message").newInstance()
  
  // 4. Parse Input Data
  def jsonSlurper = new JsonSlurper()
  def inputPayload = """\${'''${payload.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'''}"""
  def inputHeaders = jsonSlurper.parseText('''${headers.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
  def inputProperties = jsonSlurper.parseText('''${properties.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}''')
  
  message.setBody(inputPayload)
  inputHeaders.each { k, v -> message.setHeader(k, v) }
  inputProperties.each { k, v -> message.setProperty(k, v) }

  message = scriptInstance.processData(message)
} catch (Throwable e) {
    System.out.flush()
    System.setOut(old)
    println "===RESULT_START==="
    println JsonOutput.toJson([status: 'error', errorMessage: e.getClass().getName() + ": " + e.getMessage(), logs: baos.toString()])
    println "===RESULT_END==="
    return
} finally {
    System.out.flush()
    System.setOut(old)
}

def logs = baos.toString()
def result = [
  status: 'success',
  body: message.getBody()?.toString() ?: "",
  headers: message.getHeaders(),
  properties: message.getProperties(),
  logs: logs
]
println "===RESULT_START==="
println JsonOutput.toJson(result)
println "===RESULT_END==="
`;

    const runnerPath = path.join(executionDir, 'runner.groovy');
    fs.writeFileSync(runnerPath, runnerScript);
    
    // 4. Execute the Runner using java and the groovy standalone jars
    const cpSeparator = process.platform === 'win32' ? ';' : ':';
    const classPath = [
       path.join(__dirname, 'groovy-4.0.15.jar'),
       path.join(__dirname, 'groovy-json-4.0.15.jar'),
       path.join(__dirname, 'groovy-xml-4.0.15.jar'),
       '.'
    ].join(cpSeparator);
    
    // Using a consistent lowercase filename for Linux compatibility
    // Optimized: Added -XX:TieredStopAtLevel=1 for faster startup
    const jvmArgs = [
      '-Xmx64m', 
      '-Xms16m', 
      '-XX:TieredStopAtLevel=1',
      '-XX:MaxMetaspaceSize=64m', 
      '-Xss256k',
      '-cp', classPath,
      'groovy.ui.GroovyMain',
      'runner.groovy'
    ];
      
    console.log('Spawning: java', jvmArgs.join(' '));

    const child = spawn('java', jvmArgs, { cwd: executionDir });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    
    child.on('error', (err) => {
      console.error('Spawn error:', err);
      res.json({ status: 'error', errorMessage: 'Failed to start Java process: ' + err.message });
    });

    child.on('close', (code) => {
      console.log(`Java process exited with code ${code}`);
      if (stdout) console.log('STDOUT:', stdout);
      if (stderr) console.error('STDERR:', stderr);
      
      // Attempt to extract the JSON result from stdout
      const resultMatch = stdout.match(/===RESULT_START===\r?\n([\s\S]*?)\r?\n===RESULT_END===/);
      
      let finalResult;
      
      if (resultMatch && resultMatch[1]) {
        try {
           finalResult = JSON.parse(resultMatch[1]);
        } catch (e) {
           finalResult = { 
             status: 'error', 
             errorMessage: 'Failed to parse execution result JSON.', 
             logs: stdout + (stderr ? '\nSTDERR:\n' + stderr : '') 
           };
        }
      } else if (code !== 0) {
        // Collect ALL available info if it fails
        const details = `\n--- PROCESS ERROR (Exit Code ${code}) ---\n\n--- STDOUT ---\n${stdout}\n\n--- STDERR ---\n${stderr}`;
        finalResult = { 
          status: 'error', 
          errorMessage: 'Backend process failed with code ' + code + '. See logs for details.', 
          logs: details
        };
      } else {
        finalResult = { 
          status: 'error', 
          errorMessage: 'Script finished without outputting result format.', 
          logs: `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}` 
        };
      }

      // Cleanup
      try {
        fs.rmSync(executionDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      } catch (e) {
        console.error('Failed to clean up temp dir:', e.message);
      }

      // Sanitize results before sending
      if (finalResult.errorMessage) finalResult.errorMessage = sanitizeResult(finalResult.errorMessage);
      if (finalResult.logs) finalResult.logs = sanitizeResult(finalResult.logs);
      if (finalResult.details) {
        if (finalResult.details.stderr) finalResult.details.stderr = sanitizeResult(finalResult.details.stderr);
        if (finalResult.details.stdout) finalResult.details.stdout = sanitizeResult(finalResult.details.stdout);
      }

      res.json(finalResult);
    });

  } catch (error) {
    try {
      fs.rmSync(executionDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    } catch (e) {
      console.error('Failed to clean up temp dir:', e.message);
    }
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Execution Engine running on http://localhost:${PORT}`);
});
