package com.hajj.backend.repository;

import com.hajj.backend.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findAllByOrderByCreatedAtDescIdDesc();

    List<Article> findAllByStatusOrderByPublishedAtDescIdDesc(Article.Status status);

    Optional<Article> findByIdAndStatus(Long id, Article.Status status);
}
