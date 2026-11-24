package com.hajj.backend.controller;

import com.hajj.backend.service.ImageStorageService;
import com.hajj.backend.service.ImageStorageService.StorageException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Admin endpoint for article images. Requires the X-Admin-Key header.
 *
 *   POST /api/admin/images — body = the raw image bytes (not multipart),
 *                            Content-Type image/jpeg, image/png or image/webp, max 5 MB
 *                            → 201 {"url": "<public URL>"}
 *
 * 400 wrong type or bytes that do not match it, 413 too large, 503 uploads not
 * configured, 502 the bucket refused the upload.
 */
@RestController
@RequestMapping("/api/admin/images")
public class AdminImageController {

    static final int MAX_BYTES = 5 * 1024 * 1024;

    private final ImageStorageService storage;

    @Value("${app.admin.api-key}")
    private String adminApiKey;

    public AdminImageController(ImageStorageService storage) {
        this.storage = storage;
    }

    @PostMapping
    public ResponseEntity<?> upload(
            @RequestHeader(value = "X-Admin-Key", required = false) String key,
            HttpServletRequest request) throws IOException {
        if (!adminApiKey.equals(key)) return error(401, "Invalid or missing admin key");
        if (!storage.isConfigured()) return error(503, "Image uploads are not configured");

        String type = declaredType(request.getContentType());
        String extension = switch (type) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> null;
        };
        if (extension == null) return error(400, "Only JPEG, PNG and WebP images are accepted");
        if (request.getContentLengthLong() > MAX_BYTES) return tooLarge();

        // Content-Length can be absent or wrong, so read at most one byte past the limit.
        byte[] data;
        try (InputStream in = request.getInputStream()) {
            data = in.readNBytes(MAX_BYTES + 1);
        }
        if (data.length > MAX_BYTES) return tooLarge();
        if (!matchesType(type, data)) return error(400, "The file is not a valid " + type.substring(6).toUpperCase(Locale.ROOT) + " image");

        try {
            String url = storage.upload("articles/" + UUID.randomUUID() + "." + extension, type, data);
            return ResponseEntity.status(201).body(Map.of("url", url));
        } catch (StorageException e) {
            return error(502, "The image could not be stored. Try again later.");
        }
    }

    private static String declaredType(String contentType) {
        if (contentType == null) return "";
        int semicolon = contentType.indexOf(';');
        return (semicolon < 0 ? contentType : contentType.substring(0, semicolon)).trim().toLowerCase(Locale.ROOT);
    }

    /** The file's first bytes must be the signature of the declared type. */
    private static boolean matchesType(String type, byte[] d) {
        return switch (type) {
            case "image/jpeg" -> startsWith(d, 0xFF, 0xD8, 0xFF);
            case "image/png" -> startsWith(d, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A);
            // "RIFF", a 4-byte size, then "WEBP"
            case "image/webp" -> d.length >= 12 && startsWith(d, 0x52, 0x49, 0x46, 0x46)
                    && Arrays.equals(Arrays.copyOfRange(d, 8, 12), new byte[] {0x57, 0x45, 0x42, 0x50});
            default -> false;
        };
    }

    private static boolean startsWith(byte[] d, int... signature) {
        if (d.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((d[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private static ResponseEntity<?> tooLarge() {
        return error(413, "The image is larger than 5 MB");
    }

    private static ResponseEntity<?> error(int status, String message) {
        return ResponseEntity.status(status).body(Map.of("error", message));
    }
}
