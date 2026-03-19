
package com.sap.gateway.ip.core.customdev.util;

import java.util.HashMap;
import java.util.Map;

public class Message {
    private Object body;
    private Map<String, Object> headers = new HashMap<>();
    private Map<String, Object> properties = new HashMap<>();

    public void setBody(Object body) { this.body = body; }
    public Object getBody() { return this.body; }
    public <T> T getBody(Class<T> type) { return (T) this.body; }
    
    public void setHeader(String name, Object value) { this.headers.put(name, value); }
    public void setHeaders(Map<String, Object> headers) { this.headers = headers; }
    public Map<String, Object> getHeaders() { return this.headers; }
    public Object getHeader(String name) { return this.headers.get(name); }

    public void setProperty(String name, Object value) { this.properties.put(name, value); }
    public void setProperties(Map<String, Object> properties) { this.properties = properties; }
    public Map<String, Object> getProperties() { return this.properties; }
    public Object getProperty(String name) { return this.properties.get(name); }
}
