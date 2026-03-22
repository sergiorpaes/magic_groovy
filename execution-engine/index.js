const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

// Email Transporter (Gmail with App Password)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'integrate.education.solutions@gmail.com',
    pass: process.env.EMAIL_PASSWORD
  }
});

// Database connection (Neon Postgres)
console.log('DB Config Check:', {
  hasNetlifyUrl: !!process.env.NETLIFY_DATABASE_URL,
  hasDbUrl: !!process.env.DATABASE_URL,
  hasEmailUser: !!process.env.EMAIL_USER,
  hasEmailPass: !!process.env.EMAIL_PASSWORD
});

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Initialize Database Tables
async function initDB() {
  try {
    const client = await pool.connect();
    console.log('Connected to Neon Postgres.');
    await client.query(`
      CREATE TABLE IF NOT EXISTS magic_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        activation_code VARCHAR(10),
        is_active BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables verified/created with magic_ prefix.');
    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDB();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const TEMP_DIR = path.join(__dirname, 'temp');

// Check Java availability
try {
  const { execSync } = require('child_process');
  console.log('Checking Java availability...');
  const javaVer = execSync('java -version 2>&1').toString();
  console.log('Java Version:\n', javaVer);
} catch (e) {
  console.error('CRITICAL: Java was NOT found in the system PATH.');
}

// Check Groovy JARs availability
const jars = ['groovy-4.0.15.jar', 'groovy-json-4.0.15.jar', 'groovy-xml-4.0.15.jar'];
jars.forEach(jar => {
  const p = path.join(__dirname, jar);
  if (fs.existsSync(p)) {
    console.log(`Found JAR: ${jar}`);
  } else {
    console.warn(`Local JAR not found: ${jar} (might be using /opt/groovy/lib/)`);
  }
});

const optLib = '/opt/groovy/lib';
if (fs.existsSync(optLib)) {
    try {
        const files = fs.readdirSync(optLib);
        console.log(`Found /opt/groovy/lib with ${files.length} items.`);
        const coreJar = files.find(f => f.startsWith('groovy-4') && f.endsWith('.jar'));
        console.log(`Core Groovy JAR in /opt/groovy/lib: ${coreJar || 'NOT FOUND'}`);
    } catch (e) {
        console.error(`Error reading /opt/groovy/lib: ${e.message}`);
    }
} else if (process.platform !== 'win32') {
    console.warn('WARNING: /opt/groovy/lib was NOT found on Linux.');
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
// --- Authentication Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, lang = 'pt' } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await pool.query(
      'INSERT INTO magic_users (name, email, password_hash, activation_code) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
      [name, email, passwordHash, activationCode]
    );

    // Email Templates
    const templates = {
      pt: {
        subject: '✨ Ative seu acesso ao Magic Groovy',
        title: 'Bem-vindo ao Magic Groovy!',
        body: `Olá <b>${name}</b>, para começar sua jornada mágica, use o código abaixo para ativar sua conta:`,
        footer: 'Cole este código no portal para liberar seu acesso.',
        ignore: 'Se você não solicitou este cadastro, ignore este e-mail.'
      },
      en: {
        subject: '✨ Activate your Magic Groovy account',
        title: 'Welcome to Magic Groovy!',
        body: `Hi <b>${name}</b>, to start your magic journey, use the code below to activate your account:`,
        footer: 'Paste this code in the portal to unlock your access.',
        ignore: "If you didn't request this registration, please ignore this email."
      },
      es: {
        subject: '✨ Activa tu cuenta de Magic Groovy',
        title: '¡Bienvenido a Magic Groovy!',
        body: `Hola <b>${name}</b>, para comenzar tu viaje mágico, usa el código a continuación para activar tu cuenta:`,
        footer: 'Pega este código en el portal para desbloquear tu acceso.',
        ignore: 'Si no solicitaste este registro, ignora este correo electrónico.'
      }
    };

    const t = templates[lang] || templates.pt;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'integrate.education.solutions@gmail.com',
      to: email,
      subject: t.subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0078d4;">${t.title}</h2>
          <p>${t.body}</p>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #334155;">${activationCode}</span>
          </div>
          <p>${t.footer}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #64748b;">${t.ignore}</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SENT] To: ${email} | Lang: ${lang} | Code: ${activationCode}`);
      
      // Admin Notification
      const adminMailOptions = {
        from: process.env.EMAIL_USER || 'integrate.education.solutions@gmail.com',
        to: process.env.EMAIL_USER || 'integrate.education.solutions@gmail.com',
        subject: '🆕 Novo Usuário Registrado - Magic Groovy',
        html: `
          <h3>Novo cadastro realizado!</h3>
          <p><b>Nome:</b> ${name}</p>
          <p><b>E-mail:</b> ${email}</p>
          <p><b>Idioma:</b> ${lang}</p>
          <p><b>Data:</b> ${new Date().toLocaleString()}</p>
        `
      };
      await transporter.sendMail(adminMailOptions);
      console.log(`[ADMIN NOTIFIED] For new user: ${email}`);
    } catch (mailErr) {
      console.error('Failed to send email:', mailErr);
    }

    res.status(201).json({ 
      message: 'User registered. Please check your email for the activation code.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('CRITICAL Registration error:', err);
    if (err.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Error creating user', details: err.message });
  }
});

// Activate
app.post('/api/auth/activate', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE magic_users SET is_active = TRUE, activation_code = NULL WHERE email = $1 AND activation_code = $2 RETURNING id, name, email',
      [email, code]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid activation code or email' });
    }

    res.json({ message: 'Account activated successfully!', user: result.rows[0] });
  } catch (err) {
    console.error('Activation error:', err);
    res.status(500).json({ error: 'Error activating account', details: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM magic_users WHERE email = $1',
      [email]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account not activated. Please check your email.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user info. In a real app, we'd return a JWT.
    res.json({ 
      message: 'Login successful', 
      user: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Error logging in', details: err.message });
  }
});

// Health check updated with DB info
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'error';
  }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date(), 
    engine: 'active',
    database: dbStatus 
  });
});

app.post('/api/execute', async (req, res) => {
  const { 
    script, 
    payload = '', 
    headers = '{}', 
    properties = '{}' 
  } = req.body;

  if (!script) {
    return res.status(400).json({ error: 'Script is required' });
  }

  const executionId = crypto.randomBytes(8).toString('hex');
  const executionDir = path.join(TEMP_DIR, executionId);
  fs.mkdirSync(executionDir);

  try {
    // 2. Write the user's script with common CPI imports for compatibility
    const scriptPath = path.join(executionDir, 'UserScript.groovy');
    
    // Inject common imports used in CPI and handle Groovy 4 moves
    const injectedImports = `
import com.sap.gateway.ip.core.customdev.util.Message
import com.sap.gateway.ip.core.customdev.util.Exchange
import groovy.xml.*
import groovy.util.*
import groovy.json.*
import groovy.time.*
import java.io.*
import java.util.*
import java.text.*
import java.math.*
import java.net.*
`;
    fs.writeFileSync(scriptPath, injectedImports + "\n" + script);

    // 3. Create the Runner Script that glues everything together
    // Optimized: Classes are defined directly to avoid multiple parseClass calls
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

    Object getExchange() { new com.sap.gateway.ip.core.customdev.util.Exchange(this) }

    void setBody(Object v) { _body = v }
    Object getBody() { _body }
    Object getBody(Class t) {
        if (t != null && t.getName() == "java.io.Reader") return new java.io.StringReader(_body?.toString() ?: "")
        if (t != null && t.getName() == "java.io.InputStream") return new java.io.ByteArrayInputStream((_body?.toString() ?: "").getBytes("UTF-8"))
        return _body 
    }
    
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

public class Exchange {
    private Message _msg
    Exchange(Message m) { _msg = m }
    Message getIn() { _msg }
    Message getOut() { _msg }
}
"""

def itkSource = """
package com.sap.it.api.itk
public class ITKException extends RuntimeException {
    public ITKException(String message) { super(message) }
    public ITKException(Throwable cause) { super(cause) }
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
gcl.parseClass(itkSource)

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
    
    // 4. Execute the Runner using java with a merged classpath
    const cpSeparator = process.platform === 'win32' ? ';' : ':';
    let classPathDirs = [ __dirname ]; 
    
    if (process.platform !== 'win32') {
        const groovyLib = '/opt/groovy/lib';
        if (fs.existsSync(groovyLib)) {
            classPathDirs.push(groovyLib);
        }
    }
    
    // Build explicit classpath with all jars found
    let finalClassPath = [];
    classPathDirs.forEach(dir => {
        try {
            if (fs.existsSync(dir) && fs.lstatSync(dir).isDirectory()) {
                const files = fs.readdirSync(dir);
                files.filter(f => f.endsWith('.jar')).forEach(f => {
                    finalClassPath.push(path.join(dir, f));
                });
            }
        } catch (e) {
            // Silently ignore or log minimally
        }
    });
    
    // Always add current directory for the script and runner
    finalClassPath.push('.');
    
    const classPathStr = finalClassPath.join(cpSeparator);
    
    // Using a consistent lowercase filename for Linux compatibility
    // Optimized: Added -XX:TieredStopAtLevel=1 for faster startup
    const jvmArgs = [
      '-Xmx64m', 
      '-Xms16m', 
      '-XX:TieredStopAtLevel=1',
      '-XX:MaxMetaspaceSize=64m', 
      '-Xss256k',
      '-cp', classPathStr,
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
      if (!res.headersSent) {
        res.status(500).json({ status: 'error', errorMessage: 'Failed to start Java process: ' + err.message });
      }
    });

    child.on('close', (code) => {
      if (res.headersSent) return;
      
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
  console.log(`Execution Engine running on port ${PORT}`);
});
