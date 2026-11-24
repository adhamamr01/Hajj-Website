package com.hajj.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Stores article images in an OCI Object Storage bucket that is public-read.
 *
 * Uploads PUT to a bucket-level pre-authenticated request (PAR) URL with write
 * permission, so no OCI SDK or request signing is needed:
 *   https://objectstorage.REGION.oraclecloud.com/p/SECRET/n/NAMESPACE/b/BUCKET/o/
 * The object's public URL is the same address without the /p/SECRET segment.
 * The PAR URL is a secret: it is never logged.
 */
@Service
public class ImageStorageService {

    /** Thrown when the bucket refuses the upload or cannot be reached. */
    public static class StorageException extends RuntimeException {
        public StorageException(String message) {
            super(message);
        }
    }

    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);

    /** group 1 = scheme://host, group 2 = /n/NAMESPACE/b/BUCKET/o/ */
    private static final Pattern PAR_FORMAT = Pattern.compile("^(https?://[^/]+)/p/[^/]+(/n/[^/]+/b/[^/]+/o/)$");

    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final String parUrl;
    private final String publicBase;

    public ImageStorageService(@Value("${images.upload-par-url:${IMAGE_UPLOAD_PAR_URL:}}") String configured) {
        String trimmed = configured == null ? "" : configured.trim();
        Matcher m = PAR_FORMAT.matcher(trimmed);
        if (m.matches()) {
            this.parUrl = trimmed;
            this.publicBase = m.group(1) + m.group(2);
            log.info("Image uploads: configured");
        } else {
            this.parUrl = null;
            this.publicBase = null;
            log.info("Image uploads: not configured{}", trimmed.isEmpty() ? "" : " (the value is not a valid PAR URL)");
        }
    }

    public boolean isConfigured() {
        return parUrl != null;
    }

    /** Uploads the bytes as the named object and returns its public URL. */
    public String upload(String objectName, String contentType, byte[] data) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(parUrl + objectName))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", contentType)
                .header("Cache-Control", "public, max-age=31536000, immutable")
                .PUT(HttpRequest.BodyPublishers.ofByteArray(data))
                .build();
        try {
            HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() / 100 != 2) {
                log.error("Image upload rejected by object storage: HTTP {}", response.statusCode());
                throw new StorageException("Object storage returned HTTP " + response.statusCode());
            }
        } catch (IOException e) {
            // An I/O error's message can contain the request URL, so log only its type.
            log.error("Image upload failed: {}", e.getClass().getSimpleName());
            throw new StorageException("Object storage unreachable");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new StorageException("Interrupted");
        }
        return publicBase + objectName;
    }
}
