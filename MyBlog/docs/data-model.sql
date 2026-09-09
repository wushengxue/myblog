-- 预留的关系型数据模型，当前前端演示仍使用 localStorage。

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  phone VARCHAR(32) NOT NULL UNIQUE,
  id_card VARCHAR(32) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL
);

CREATE TABLE articles (
  id VARCHAR(64) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  visibility VARCHAR(24) NOT NULL DEFAULT 'public',
  status VARCHAR(24) NOT NULL DEFAULT 'published',
  scheduled_at TIMESTAMP NULL,
  views INT NOT NULL DEFAULT 0,
  published_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE tags (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE article_tags (
  article_id VARCHAR(64) NOT NULL,
  tag_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  CONSTRAINT fk_article_tags_article FOREIGN KEY (article_id) REFERENCES articles(id),
  CONSTRAINT fk_article_tags_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE comments (
  id VARCHAR(64) PRIMARY KEY,
  article_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_comments_article FOREIGN KEY (article_id) REFERENCES articles(id),
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE codes (
  id VARCHAR(64) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  language VARCHAR(64) NOT NULL,
  code_content TEXT NOT NULL,
  visibility VARCHAR(24) NOT NULL DEFAULT 'public',
  status VARCHAR(24) NOT NULL DEFAULT 'published',
  scheduled_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  CONSTRAINT fk_codes_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE questions (
  id VARCHAR(64) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  related_code TEXT,
  visibility VARCHAR(24) NOT NULL DEFAULT 'public',
  status VARCHAR(24) NOT NULL DEFAULT 'published',
  scheduled_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  CONSTRAINT fk_questions_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE drafts (
  id VARCHAR(64) PRIMARY KEY,
  author_id VARCHAR(64) NOT NULL,
  content_type VARCHAR(24) NOT NULL,
  payload JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_drafts_author FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE annotations (
  id VARCHAR(64) PRIMARY KEY,
  article_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  selected_text TEXT NOT NULL,
  annotation_content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  CONSTRAINT fk_annotations_article FOREIGN KEY (article_id) REFERENCES articles(id),
  CONSTRAINT fk_annotations_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  subscriber_id VARCHAR(64) NOT NULL,
  author_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  UNIQUE (subscriber_id, author_id)
);

CREATE TABLE reading_history (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64),
  article_id VARCHAR(64) NOT NULL,
  viewed_at TIMESTAMP NOT NULL
);
