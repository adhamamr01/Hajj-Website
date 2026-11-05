-- ── Bilingual articles ────────────────────────────────────────────────────
-- Articles are written in the admin tool in English and Arabic (Markdown).
-- Text columns are nullable so a draft can be saved half-finished; the
-- backend refuses to publish until title, summary and body exist in BOTH
-- languages.

CREATE TABLE article (
    id           BIGSERIAL    PRIMARY KEY,
    title_en     VARCHAR(200),
    title_ar     VARCHAR(200),
    summary_en   VARCHAR(500),
    summary_ar   VARCHAR(500),
    body_en      TEXT,
    body_ar      TEXT,
    status       VARCHAR(20)  NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    published_at TIMESTAMPTZ
);

-- ── Schema documentation ──────────────────────────────────────────────────

COMMENT ON TABLE article IS
    'Bilingual (English/Arabic) articles written in the admin tool. Only PUBLISHED rows are served publicly. '
    'A published article has an ARTICLE row in page_link whose target_key is the article id.';

COMMENT ON COLUMN article.title_en IS 'English title (max 200). Null/blank only while DRAFT.';
COMMENT ON COLUMN article.title_ar IS 'Arabic title (max 200). Null/blank only while DRAFT.';
COMMENT ON COLUMN article.summary_en IS 'English summary shown in lists and link previews (max 500). Null/blank only while DRAFT.';
COMMENT ON COLUMN article.summary_ar IS 'Arabic summary (max 500). Null/blank only while DRAFT.';
COMMENT ON COLUMN article.body_en IS 'English body in Markdown (raw HTML is not rendered). Null/blank only while DRAFT.';
COMMENT ON COLUMN article.body_ar IS 'Arabic body in Markdown, rendered right-to-left. Null/blank only while DRAFT.';
COMMENT ON COLUMN article.status IS 'DRAFT (admin only) or PUBLISHED (served publicly).';
COMMENT ON COLUMN article.published_at IS 'When the article was last published; null while DRAFT.';
