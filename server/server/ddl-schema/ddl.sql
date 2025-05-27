-- Enable unstable extensions (required for pgrag)
SET neon.allow_unstable_extensions='true';

-- Install pgrag and related extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS rag CASCADE;
CREATE EXTENSION IF NOT EXISTS rag_bge_small_en_v15 CASCADE;
CREATE EXTENSION IF NOT EXISTS rag_jina_reranker_v1_tiny_en CASCADE;

CREATE TABLE "Users" (
    "userId"       CHAR(32) PRIMARY KEY
                   DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
    "username"     VARCHAR(50) NOT NULL,
    "email"        VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Corpora" (
    "corpusId"  CHAR(32) PRIMARY KEY
                DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
    "userId"    CHAR(32) NOT NULL,
    "corpusKey" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Documents" (
    "documentId"  CHAR(32) PRIMARY KEY
                  DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
    "userId"      CHAR(32) NOT NULL,
    "corpusId"    CHAR(32) NOT NULL,
    "docType"     VARCHAR(50) NOT NULL,
    "docName"     VARCHAR(255),
    "sourceUrl"   TEXT,
    "fulltext"    TEXT,
    "createdAt"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DocumentChunks" (
    "chunkId"       CHAR(32) PRIMARY KEY
                    DEFAULT (REPLACE(gen_random_uuid()::text, '-', '')),
    "documentId"    CHAR(32) NOT NULL,
    "chunkIndex"    INT NOT NULL,
    "chunkText"     TEXT NOT NULL,
    "embeddingData" vector(384),
    "metaData"      JSONB,
    "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "DocumentChunks_embedding_hnsw_idx"
  ON "DocumentChunks"
  USING hnsw ("embeddingData" vector_cosine_ops);

CREATE INDEX "DocumentChunks_metaData_gin_idx"
  ON "DocumentChunks"
  USING GIN("metaData");
