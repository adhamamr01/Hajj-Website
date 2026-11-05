package com.hajj.backend.repository;

import com.hajj.backend.model.PageLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PageLinkRepository extends JpaRepository<PageLink, Long> {
    Optional<PageLink> findByTokenAndRevokedAtIsNull(String token);

    Optional<PageLink> findByTargetTypeAndTargetKeyAndRevokedAtIsNull(PageLink.TargetType type, String key);

    List<PageLink> findAllByRevokedAtIsNullOrderByTargetTypeAscTargetKeyAsc();
}
