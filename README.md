# RAG-ify

A comprehensive Retrieval-Augmented Generation (RAG) system for processing, storing, and retrieving document information with advanced AI capabilities, featuring both a powerful backend API and a modern React frontend.

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

RAG-ify is a powerful RAG (Retrieval-Augmented Generation) system that allows users to process documents, extract text, chunk content, generate embeddings, and perform semantic searches. The system uses state-of-the-art AI models for text processing, embedding generation, and reranking to provide accurate and relevant information retrieval.

The project consists of two main components:
1. **Backend API**: A FastAPI-based server that handles document processing, embedding generation, and semantic search
2. **Frontend Interface**: A modern React application that provides an intuitive user interface for interacting with the RAG system

## Project Structure

```
RAG-ify/
├── server/                        # Backend API
│   ├── ddl-schema/
│   │   └── ddl.sql                # Database schema definition
│   └── src/
│       ├── api/
│       │   └── routes.py          # API route definitions
│       ├── controllers/
│       │   ├── auth.py            # Authentication controller
│       │   ├── corpora.py         # Corpus management
│       │   ├── documents.py       # Document management
│       │   ├── document_chunk.py  # Document chunk management
│       │   └── users.py           # User management
│       ├── core/
│       │   ├── config.py          # Application configuration
│       │   └── db.py              # Database connection
│       ├── models/
│       │   ├── auth.py            # Authentication models
│       │   ├── corpora.py         # Corpus models
│       │   ├── documents.py       # Document models
│       │   ├── document_chunk.py  # Document chunk models
│       │   └── users.py           # User models
│       ├── services/
│       │   ├── chunking.py        # Text chunking service
│       │   ├── embedding.py       # Embedding generation service
│       │   ├── llm_services.py    # LLM integration service
│       │   ├── process_document.py # Document processing pipeline
│       │   ├── reranker.py        # Reranking service
│       │   └── text_extractor.py  # Text extraction from various file types
│       └── server.py              # Main FastAPI application
│
├── rag-navigator-unleashed/       # Frontend Application
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
- **Embedding Generation**: Create vector embeddings for document chunks using VoyageAI models
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
- **Result Export**: Export search results in various formats (PDF, DOCX, CSV, JSON)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Authentication**: Secure user login and registration

## Technologies Used

### Backend
- **FastAPI**: High-performance web framework for building APIs
- **PostgreSQL**: Database with pgvector extension for vector similarity search
- **psycopg2**: PostgreSQL adapter for Python

### Frontend
- **React**: JavaScript library for building user interfaces
- **TypeScript**: Typed superset of JavaScript for improved developer experience
- **Vite**: Next-generation frontend build tool
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind
- **React Markdown**: Markdown rendering for search results

### AI and ML
- **VoyageAI**: For embedding generation and reranking
  - Embedding Model: `voyage-3-large` - State-of-the-art embedding model for text representation
  - Reranker: `rerank-2` - Advanced reranking model to improve search relevance
- **Groq**: For LLM services
  - Model: `llama-3.3-70b-versatile` - Large language model for text processing and analysis

### Document Processing
- **PyMuPDF/PyMuPDF4LLM**: PDF processing
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
- `POST /api/v1/change-password`: Change a user's password
- `POST /api/v1/reset-password-request`: Request a password reset

## Models and Services

### Embedding Service
Uses VoyageAI's `voyage-3-large` model to generate high-quality embeddings for text chunks. These embeddings are stored in the database and used for semantic search.

```python
# Example usage
from services.embedding import get_embedding
embeddings = get_embedding("voyage-3-large", ["Your text here"])
```

### Reranking Service
Uses VoyageAI's `rerank-2` model to improve search results by reordering them based on relevance to the query.

```python
# Example usage
from services.reranker import re_rank
reranked_results = re_rank("your query", ["document1", "document2", "document3"], model="rerank-2", top_k=3)
```

### LLM Service
Uses Groq's `llama-3.3-70b-versatile` model for various text processing tasks, including automatic chunking and metadata generation.

```python
# Example usage
from services.llm_services import llm_service
response = llm_service("Your prompt here", "llama-3.3-70b-versatile")
```

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

The system uses PostgreSQL with the pgvector extension for vector similarity search:

- **Users**: Store user information
- **Corpora**: Collections of documents
- **Documents**: Store document metadata
- **DocumentChunks**: Store document chunks with vector embeddings

The `DocumentChunks` table includes a vector column for storing embeddings and uses HNSW indexing for efficient similarity search.

## Getting Started

### Prerequisites
- Python 3.8+
- PostgreSQL with pgvector extension
- Node.js & npm
- API keys for VoyageAI and Groq

### Backend Setup

1. Clone the repository
2. Install Python dependencies:
   ```
   cd RAG-ify/server
   pip install -r requirements.txt
   ```
3. Set up the PostgreSQL database using the DDL schema in `server/ddl-schema/ddl.sql`
4. Configure API keys in the environment variables
5. Start the server:
   ```
   $env:PYTHONPATH="d:\GitHub\Projects\RAG-ify\server\src"; python -m uvicorn server:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd rag-navigator-unleashed
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your API key:
   ```
   VITE_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`

## API Keys

The system uses the following API keys:

- **VoyageAI API Key**: Used for embedding generation and reranking
  - Service URL: https://api.voyageai.com/
  - Models:
    - `voyage-3-large`: For embedding generation
    - `rerank-2`: For reranking search results

- **Groq API Key**: Used for LLM services
  - Service URL: https://api.groq.com/
  - Model: `llama-3.3-70b-versatile`

- **API Authentication**: The system uses a custom API key for endpoint authentication