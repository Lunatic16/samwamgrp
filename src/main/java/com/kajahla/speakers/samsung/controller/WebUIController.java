package com.kajahla.speakers.samsung.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.GetMapping;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;

@Controller
public class WebUIController {

    @GetMapping(value = {"/", "/index.html", "/home", "/ui"})
    public ResponseEntity<String> index() throws IOException {
        Resource resource = new ClassPathResource("static/index.html");
        if (!resource.exists()) {
            return ResponseEntity.status(404).body("<html><body><h1>File not found: static/index.html</h1></body></html>");
        }
        try (InputStream inputStream = resource.getInputStream()) {
            String content = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("<html><body><h1>Error reading file: " + e.getMessage() + "</h1></body></html>");
        }
    }

    @GetMapping("/style.css")
    public ResponseEntity<String> css() throws IOException {
        Resource resource = new ClassPathResource("static/style.css");
        if (!resource.exists()) {
            return ResponseEntity.status(404).body("/* File not found: static/style.css */");
        }
        try (InputStream inputStream = resource.getInputStream()) {
            String content = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("text/css"))
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("/* Error reading file: " + e.getMessage() + " */");
        }
    }

    @GetMapping("/script.js")
    public ResponseEntity<String> js() throws IOException {
        Resource resource = new ClassPathResource("static/script.js");
        if (!resource.exists()) {
            return ResponseEntity.status(404).body("// File not found: static/script.js");
        }
        try (InputStream inputStream = resource.getInputStream()) {
            String content = StreamUtils.copyToString(inputStream, StandardCharsets.UTF_8);
            return ResponseEntity.ok()
                    .contentType(MediaType.valueOf("application/javascript"))
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                    .body(content);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("// Error reading file: " + e.getMessage() + "");
        }
    }
}