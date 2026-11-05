package com.hajj.backend.service;

import com.hajj.backend.model.PageLink;
import com.hajj.backend.model.PageLink.TargetType;
import com.hajj.backend.repository.PageLinkRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

/**
 * Creates, resolves and resets the secret links used in link-only mode.
 * Not cached on purpose: a reset must take effect on the very next request.
 */
@Service
public class PageLinkService {

    /** Every page that gets a link. Must match the keys the frontend knows. */
    public static final List<String> PAGE_KEYS = List.of("home", "journey", "meeqat", "boundaries");

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_TOKEN_LENGTH = 64;

    private final PageLinkRepository repo;

    public PageLinkService(PageLinkRepository repo) {
        this.repo = repo;
    }

    /** Creates an active link for every page that does not have one yet. */
    @Transactional
    public void ensurePageLinks() {
        for (String key : PAGE_KEYS) {
            if (repo.findByTargetTypeAndTargetKeyAndRevokedAtIsNull(TargetType.PAGE, key).isEmpty()) {
                repo.save(new PageLink(newToken(), TargetType.PAGE, key));
            }
        }
    }

    /** The active link for a token, or empty when the token is unknown, revoked or malformed. */
    @Transactional(readOnly = true)
    public Optional<PageLink> resolve(String token) {
        if (token == null || token.isBlank() || token.length() > MAX_TOKEN_LENGTH) return Optional.empty();
        return repo.findByTokenAndRevokedAtIsNull(token);
    }

    @Transactional(readOnly = true)
    public List<PageLink> listActive() {
        return repo.findAllByRevokedAtIsNullOrderByTargetTypeAscTargetKeyAsc();
    }

    /** Revokes the active link for a page and returns a fresh one; empty for an unknown page key. */
    @Transactional
    public Optional<PageLink> resetPage(String key) {
        if (!PAGE_KEYS.contains(key)) return Optional.empty();

        repo.findByTargetTypeAndTargetKeyAndRevokedAtIsNull(TargetType.PAGE, key).ifPresent(old -> {
            old.setRevokedAt(Instant.now());
            // Flush now: Hibernate runs inserts before updates, which would hit the
            // one-active-link-per-target unique index.
            repo.saveAndFlush(old);
        });
        return Optional.of(repo.save(new PageLink(newToken(), TargetType.PAGE, key)));
    }

    /** 128 bits from SecureRandom, base64url without padding (22 chars). */
    private static String newToken() {
        byte[] bytes = new byte[16];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
