# Neon-RAG

A comprehensive Retrieval-Augmented Generation (RAG) system for processing, storing, and retrieving document information with advanced AI capabilities, featuring both a powerful backend API and a modern React frontend. This project leverages Neon's PostgreSQL serverless database with pgRAG extensions for efficient vector search and reranking.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [API Endpoints](#api-endpoints)
- [Models and Services](#models-and-services)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Keys](#api-keys)

## Overview

Neon-RAG is a powerful RAG (Retrieval-Augmented Generation) system that allows users to process documents, extract text, chunk content, generate embeddings, and perform semantic searches. The system uses state-of-the-art AI models for text processing, embedding generation, and reranking to provide accurate and relevant information retrieval.

The project consists of two main components:
1. **Backend API**: A FastAPI-based server that handles document processing, embedding generation, and semantic search
2. **Frontend Interface**: A modern React application that provides an intuitive user interface for interacting with the RAG system

## Project Structure

```
Neon-RAG/
├── server/                        # Backend API
│   ├── ddl-schema/                # Database schema definitions
│   ├── server/
│   │   └── src/
│   │       ├── api/
│   │       │   └── routes.py      # API route definitions
│   │       ├── controllers/
│   │       │   ├── auth.py        # Authentication controller
│   │       │   ├── corpora.py     # Corpus management
│   │       │   ├── documents.py   # Document management
│   │       │   ├── document_chunk.py # Document chunk management
│   │       │   └── users.py       # User management
│   │       ├── core/
│   │       │   ├── config.py      # Application configuration
│   │       │   └── db.py          # Database connection
│   │       ├── models/
│   │       │   ├── auth.py        # Authentication models
│   │       │   ├── corpora.py     # Corpus models
│   │       │   ├── documents.py   # Document models
│   │       │   ├── document_chunk.py # Document chunk models
│   │       │   └── users.py       # User models
│   │       ├── services/
│   │       │   ├── chunking.py    # Text chunking service
│   │       │   ├── embedding.py   # Embedding generation service
│   │       │   ├── llm_services.py # LLM integration service
│   │       │   ├── process_document.py # Document processing pipeline
│   │       │   ├── reranker.py    # Reranking service
│   │       │   └── text_extractor.py # Text extraction from various file types
│   │       └── server.py          # Main FastAPI application
│   ├── init_neon_db.py            # Database initialization script
│   ├── migrate_to_neon.py         # Database migration script
│   └── test_db_connection.py      # Database connection test
│
├── client/                        # Frontend Application
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── components/            # React components
│   │   │   ├── ui/                # UI components (shadcn-ui)
│   │   │   ├── AuthForm.tsx       # Authentication form
│   │   │   ├── ChatInterface.tsx  # Main chat interface
│   │   │   ├── CorpusTable.tsx    # Corpus management
│   │   │   ├── DocumentUpload.tsx # Document upload component
│   │   │   ├── Navbar.tsx         # Navigation component
│   │   │   └── ResultDisplay.tsx  # Search results display
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # Utility functions
│   │   ├── pages/                 # Page components
│   │   │   ├── Chat.tsx           # Chat page
│   │   │   ├── Index.tsx          # Home page
│   │   │   ├── KnowledgeBase.tsx  # Knowledge base management
│   │   │   ├── Login.tsx          # Login page
│   │   │   └── Signup.tsx         # Signup page
│   │   ├── services/              # API services
│   │   │   ├── api.ts             # API client
│   │   │   └── auth.ts            # Authentication service
│   │   ├── App.tsx                # Main application component
│   │   └── main.tsx               # Application entry point
│   ├── package.json               # Frontend dependencies
│   └── vite.config.ts             # Vite configuration
```

## Features

### Backend Features
- **Document Processing**: Extract text from various file formats (PDF, DOCX, PPTX, images)
- **Text Chunking**: Split documents into manageable chunks using manual or AI-assisted methods
- **Embedding Generation**: Create vector embeddings for document chunks using VoyageAI models and pgRAG
- **Semantic Search**: Find relevant document chunks based on query similarity
- **Reranking**: Improve search results with advanced reranking algorithms
- **User Management**: Create and manage user accounts
- **Corpus Management**: Organize documents into logical collections
- **API-First Design**: All functionality exposed through a RESTful API

### Frontend Features
- **Intuitive Chat Interface**: Ask questions about your documents in a conversational format
- **Document Management**: Upload, view, and organize documents in your knowledge base
- **Corpus Organization**: Create and manage document collections
- **Search Visualization**: View and explore search results with confidence scores
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Authentication**: Secure user login and registration

## Technologies Used

### Backend
- **FastAPI**: High-performance web framework for building APIs
- **Neon PostgreSQL**: Serverless PostgreSQL database with pgRAG extensions
- **pgRAG**: PostgreSQL extensions for vector similarity search and reranking
- **psycopg2**: PostgreSQL adapter for Python

### Frontend
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript for improved developer experience
- **Vite**: Next-generation frontend build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind

### AI Integration
- **VoyageAI**: For external embedding generation
  - Embedding Model: `voyage-3-large` - State-of-the-art embedding model for text representation
- **Mistral AI**: For LLM services
  - Model: `mistral-large-latest` - Large language model for text processing and analysis
- **pgRAG Models**:
  - `rag`: Core pgRAG functionality for vector operations (Unstable)
  - `rag_bge_small_en_v15`: For local embedding generation (Unstable)
  - `rag_jina_reranker_v1_tiny_en`: For local reranking (Unstable)
  - `pgvector`: PostgreSQL extension for vector similarity search
  - `rag_extraction`: For text extraction from documents (Unstable)
  - `rag_chunking`: For intelligent text chunking (Unstable)

### Document Processing
- **PyMuPDF**: PDF processing
- **python-docx**: DOCX file processing
- **python-pptx**: PowerPoint file processing
- **Pillow & pytesseract**: Image processing and OCR
- **BeautifulSoup**: HTML parsing and text extraction

## API Endpoints

### Document Processing
- `POST /api/v1/extractor`: Extract text from uploaded files
- `POST /api/v1/chunking`: Split text into manageable chunks
- `POST /api/v1/embedding`: Generate embeddings for text chunks
- `POST /api/v1/rerank`: Rerank search results based on relevance
- `POST /api/v1/process-document`: Process a document through the entire pipeline

### User Management
- `GET /api/v1/users`: Get all users
- `GET /api/v1/user/{userId}`: Get a specific user
- `POST /api/v1/user`: Create a new user
- `PUT /api/v1/user/{userId}`: Update a user
- `DELETE /api/v1/user/{userId}`: Delete a user

### Corpus Management
- `GET /api/v1/corpuses`: Get all corpora
- `GET /api/v1/corpus/{corpusId}`: Get a specific corpus
- `POST /api/v1/corpus`: Create a new corpus
- `PUT /api/v1/corpus/{corpusId}`: Update a corpus
- `DELETE /api/v1/corpus/{corpusId}`: Delete a corpus

### Document Management
- `GET /api/v1/documents`: Get all documents
- `GET /api/v1/document/{documentId}`: Get a specific document
- `POST /api/v1/document`: Create a new document
- `PUT /api/v1/document/{documentId}`: Update a document
- `DELETE /api/v1/document/{documentId}`: Delete a document

### Document Chunk Management
- `GET /api/v1/chunks`: Get all document chunks
- `GET /api/v1/chunk/{chunkId}`: Get a specific document chunk
- `POST /api/v1/chunk`: Create a new document chunk
- `PUT /api/v1/chunk/{chunkId}`: Update a document chunk
- `DELETE /api/v1/chunk/{chunkId}`: Delete a document chunk
- `POST /api/v1/search`: Search for relevant document chunks

### Authentication
- `POST /api/v1/register`: Register a new user
- `POST /api/v1/login`: Login a user

## Models and Services

### Embedding Service
The system supports two embedding approaches:

1. **VoyageAI Embeddings** (External API):

2. **pgRAG Text Extraction & Chunking** (Local in Neon Database):


### LLM Service
Uses Mistral AI's `mistral-large-latest` model for various text processing tasks:

### Text Extraction Service
Extracts text from various file formats:
- PDF (using PyMuPDF)
- DOCX (using python-docx)
- PPTX (using python-pptx)
- Images (using Pillow and pytesseract)
- URLs (using requests and BeautifulSoup)

### Chunking Service
Splits text into manageable chunks using either:
- Manual chunking: Based on word count with configurable overlap
- Automatic chunking: Using LLM to intelligently split text while preserving context

## Database Schema

The system uses Neon PostgreSQL with pgRAG extensions for vector similarity search:

- **Users**: Store user information
- **Corpora**: Collections of documents
- **Documents**: Store document metadata
- **DocumentChunks**: Store document chunks with vector embeddings

The `DocumentChunks` table includes a vector column for storing embeddings and uses HNSW indexing for efficient similarity search.

## Getting Started

### Prerequisites
- Python 3.8+
- [Neon PostgreSQL account](https://neon.tech) (Free tier available)
- Node.js & npm
- API keys for VoyageAI and Mistral AI

### Backend Setup

1. Clone the repository
2. Install Python dependencies:
   ```
   cd Neon-RAG/server
   pip install -r requirements.txt
   ```
3. Set up your Neon database:
   - Create an account at [Neon.tech](https://neon.tech)
   - Create a new project
   - In the project dashboard, click on "Connection Details"
   - Copy the connection string (it should look like `postgres://user:password@endpoint/database`)
   - Enable the "Allow unstable extensions" option in your project settings

4. Set up environment variables in a `.env` file:
   ```
   DATABASE_URL=your_neon_database_url_from_step_3
   VOYAGE_API_KEY=your_voyage_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   ```
5. Initialize the Neon database with pgRAG extensions:
   ```
   python init_neon_db.py
   ```
5. Start the server:
   ```
   cd server/src
   uvicorn src.server:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd Neon-RAG/client
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your API URL:
   ```
   VITE_API_URL=http://localhost:8000/api/v1
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`

## API Keys and External Services

The system uses the following API keys and external services:

- **VoyageAI API Key**: Used for external embedding generation
  - Sign up at: https://voyageai.com/
  - Service URL: https://api.voyageai.com/
  - Model: `voyage-3-large`

- **Mistral AI API Key**: Used for LLM services
  - Sign up at: https://console.mistral.ai/
  - Service URL: https://api.mistral.ai/
  - Model: `mistral-large-latest`

- **Neon Database**: Used for PostgreSQL with pgRAG extensions
  - Sign up at: https://neon.tech/
  - Features: Serverless PostgreSQL, vector similarity search, and reranking
  - Required Extensions: `rag`, `rag_bge_small_en_v15`, `rag_jina_reranker_v1_tiny_en`, `pgvector`
  - Configuration: Enable "Allow unstable extensions" in project settings
  - Connection: Use the connection string from Neon dashboard as your DATABASE_URL