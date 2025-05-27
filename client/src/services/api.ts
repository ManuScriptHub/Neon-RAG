import { toast } from "sonner";

// Base URL for API endpoints
const API_URL = "/api/v1";
export type Chunk = [number, string, number]; // [index, content, similarity_score]

// Type definitions
export type Corpus = {
  key: string;
  name: string;
  description?: string;
  documentCount: number;
  createdAt: Date;
  userId?: string;
};

export type Document = {
  id: string;
  fileName: string;
  fileType: string;
  corpusKey: string;
  size: number;
  uploadDate: Date;
  backendDocId?: string; // Optional field to store the backend document ID
};

export type ChatMessage = {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: Date;
};

export type SearchResult = {
  content: string;
  metadata: {
    source: string;
    page?: number;
    confidence: number;
  };
};

export type SearchResponse = {
  answer: string;
  results: SearchResult[];
  sourceDocuments: string[];
  chunks?: Chunk[]; // Add the chunks field to the response type
};

// Mock data functions
const generateMockCorpora = (): Corpus[] => {
  return [
    {
      key: "general",
      name: "General Knowledge",
      description: "General knowledge documents and references",
      documentCount: 5,
      createdAt: new Date("2023-01-15"),
      userId: "default-user", // Default user ID for mock data
    },
    {
      key: "technical",
      name: "Technical Documentation",
      description: "Technical documentation and manuals",
      documentCount: 8,
      createdAt: new Date("2023-02-20"),
      userId: "default-user", // Default user ID for mock data
    },
    {
      key: "research",
      name: "Research Papers",
      description: "Academic and research papers",
      documentCount: 3,
      createdAt: new Date("2023-03-10"),
      userId: "default-user", // Default user ID for mock data
    },
  ];
};

const generateMockDocuments = (): Record<string, Document[]> => {
  return {
    general: [
      {
        id: "doc1",
        fileName: "introduction.pdf",
        fileType: "pdf",
        corpusKey: "general",
        size: 1024 * 1024,
        uploadDate: new Date("2023-01-20"),
      },
      {
        id: "doc2",
        fileName: "overview.docx",
        fileType: "docx",
        corpusKey: "general",
        size: 512 * 1024,
        uploadDate: new Date("2023-01-25"),
      },
    ],
    technical: [
      {
        id: "doc3",
        fileName: "api_documentation.pdf",
        fileType: "pdf",
        corpusKey: "technical",
        size: 2048 * 1024,
        uploadDate: new Date("2023-02-22"),
      },
      {
        id: "doc4",
        fileName: "code_examples.txt",
        fileType: "txt",
        corpusKey: "technical",
        size: 128 * 1024,
        uploadDate: new Date("2023-02-28"),
      },
    ],
    research: [
      {
        id: "doc5",
        fileName: "research_paper.pdf",
        fileType: "pdf",
        corpusKey: "research",
        size: 3072 * 1024,
        uploadDate: new Date("2023-03-15"),
      },
    ],
  };
};

// Function to get persisted mock data from localStorage
const getPersistedMockData = (): { corpora: Corpus[], documents: Record<string, Document[]> } => {
  try {
    // Try to get persisted data from localStorage
    const persistedCorpora = localStorage.getItem('ragify-mock-corpora');
    const persistedDocuments = localStorage.getItem('ragify-mock-documents');
    
    // If we have persisted data, use it
    if (persistedCorpora && persistedDocuments) {
      return {
        corpora: JSON.parse(persistedCorpora) as Corpus[],
        documents: JSON.parse(persistedDocuments) as Record<string, Document[]>
      };
    }
  } catch (error) {
    console.error("Error loading persisted mock data:", error);
  }
  
  // If no persisted data or error, return default mock data
  return {
    corpora: generateMockCorpora(),
    documents: generateMockDocuments()
  };
};

// Function to persist mock data to localStorage
const persistMockData = (corpora: Corpus[], documents: Record<string, Document[]>) => {
  try {
    localStorage.setItem('ragify-mock-corpora', JSON.stringify(corpora));
    localStorage.setItem('ragify-mock-documents', JSON.stringify(documents));
  } catch (error) {
    console.error("Error persisting mock data:", error);
  }
};

// Initialize mock data from localStorage or defaults
const persistedData = getPersistedMockData();
let mockCorpora = persistedData.corpora;
let mockDocuments = persistedData.documents;

// API Functions
export const api = {
  // Corpus management
  getAllCorpora: async (userId?: string | null): Promise<Corpus[]> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      console.log("Fetching all corpora from database");
      
      // Fetch corpora from the database
      let whereConditions = {};
      if (userId) {
        whereConditions = { userId };
      }
      
      const corporaResponse = await fetch(`${API_URL}/corpuses?where=${encodeURIComponent(JSON.stringify(whereConditions))}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
      });
      
      if (!corporaResponse.ok) {
        throw new Error(`Failed to fetch corpora: ${corporaResponse.status} ${corporaResponse.statusText}`);
      }
      
      const corporaData = await corporaResponse.json();
      console.log("Corpora from database:", corporaData);
      
      if (!corporaData.results || !Array.isArray(corporaData.results)) {
        console.warn("No corpora found in database or invalid response format");
        return [];
      }
      
      // Now fetch document counts for each corpus
      const corpora: Corpus[] = [];
      
      for (const corpus of corporaData.results) {
        // Fetch document count for this corpus
        const countResponse = await fetch(`${API_URL}/documents?where=${encodeURIComponent(JSON.stringify({ corpusId: corpus.corpusId }))}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
        });
        
        let documentCount = 0;
        if (countResponse.ok) {
          const countData = await countResponse.json();
          documentCount = countData.results?.length || 0;
        }
        
        corpora.push({
          key: corpus.corpusKey || corpus.corpusId,
          name: corpus.corpusName || corpus.corpusKey || "Unnamed Corpus",
          description: corpus.description || "",
          documentCount: documentCount,
          userId: corpus.userId,
          createdAt: new Date(corpus.createdAt || Date.now())
        });
      }
      
      return corpora;
    } catch (error) {
      console.error("Error fetching corpora:", error);
      
      // Fallback to mock data only if there's an error
      console.warn("Falling back to mock corpora data due to error");
      const refreshedData = getPersistedMockData();
      mockCorpora = refreshedData.corpora;
      
      if (userId) {
        return mockCorpora.filter(corpus => 
          corpus.userId === userId || corpus.userId === undefined || corpus.userId === null
        );
      }
      
      return mockCorpora;
    }
  },

  createCorpus: async (name: string, userId?: string | null, description?: string): Promise<Corpus> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      console.log("Creating corpus in database");
      
      // Use the name as is for the corpus key, preserving case
      const corpusKey = name.replace(/\s+/g, "-");
      
      // Prepare the request body
      const requestBody = {
        userId: userId || "default-user", // Use a default user ID if none provided
        corpusKey: corpusKey,
        corpusName: name,
        description: description || ""
      };
      
      console.log("Request body:", requestBody);
      
      // Make the API call to create the corpus
      const response = await fetch(`${API_URL}/corpus`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error creating corpus:", errorData);
        throw new Error(errorData.error || `Failed to create corpus: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Corpus created in database:", data);
      
      if (!data.results) {
        throw new Error("Invalid response format from server");
      }
      
      // Convert the response to the expected Corpus format
      const newCorpus: Corpus = {
        key: data.results.corpusKey || data.results.corpusId,
        name: data.results.corpusName || name,
        description: data.results.description || description || "",
        documentCount: 0,
        createdAt: new Date(data.results.createdAt || Date.now()),
        userId: data.results.userId
      };
      
      return newCorpus;
    } catch (error) {
      console.error("Error in createCorpus:", error);
      
      // Fallback to mock data if there's an error
      console.warn("Falling back to mock corpus creation due to error");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Preserve case in the key
      const key = name.replace(/\s+/g, "-");
      const newCorpus: Corpus = {
        key,
        name,
        description: description || "",
        documentCount: 0,
        createdAt: new Date(),
        userId: userId || "default-user" // Use a default user ID if none provided
      };
      
      // Update mock data
      mockCorpora = [...mockCorpora, newCorpus];
      mockDocuments[key] = [];
      
      // Persist updated mock data to localStorage
      persistMockData(mockCorpora, mockDocuments);
      
      return newCorpus;
    }
  },

  // Document management
  getDocumentsByCorpus: async (corpusKey: string): Promise<Document[]> => {
    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      
      // Fetch documents from the database
      console.log(`Fetching documents for corpus: ${corpusKey}`);
      console.log(`API Key: ${apiKey ? "Present" : "Missing"}`);
      
      // First, try to fetch documents using corpusId
      console.log("Attempt 1: Fetching with corpusId parameter");
      try {
        const whereConditions = { corpusId: corpusKey };
        console.log("Where conditions:", whereConditions);
        
        const requestUrl = `${API_URL}/documents?where=${encodeURIComponent(JSON.stringify(whereConditions))}`;
        console.log(`Request URL: ${requestUrl}`);
        
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Documents from database (corpusId):", data);
          
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log(`Found ${data.results.length} documents in database using corpusId`);
            
            // Convert database documents to frontend format
            const documents: Document[] = data.results.map((doc: any) => {
              console.log("Processing document:", doc);
              return {
                id: doc.documentId || doc.docId,
                fileName: doc.docName || doc.fileName || "Unknown Document",
                fileType: doc.docType || "unknown",
                corpusKey: doc.corpusId || corpusKey,
                size: doc.size || 0,
                uploadDate: new Date(doc.createdAt || Date.now()),
                backendDocId: doc.docId
              };
            });
            
            console.log("Converted documents:", documents);
            return documents;
          }
        }
      } catch (firstAttemptError) {
        console.warn("First attempt failed:", firstAttemptError);
      }
      
      // If first attempt failed or returned no results, try with corpusKey
      console.log("Attempt 2: Fetching with corpusKey parameter");
      try {
        const whereConditions = { corpusKey: corpusKey };
        console.log("Where conditions:", whereConditions);
        
        const requestUrl = `${API_URL}/documents?where=${encodeURIComponent(JSON.stringify(whereConditions))}`;
        console.log(`Request URL: ${requestUrl}`);
        
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("Documents from database (corpusKey):", data);
          
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            console.log(`Found ${data.results.length} documents in database using corpusKey`);
            
            // Convert database documents to frontend format
            const documents: Document[] = data.results.map((doc: any) => {
              console.log("Processing document:", doc);
              return {
                id: doc.documentId || doc.docId,
                fileName: doc.docName || doc.fileName || "Unknown Document",
                fileType: doc.docType || "unknown",
                corpusKey: doc.corpusId || corpusKey,
                size: doc.size || 0,
                uploadDate: new Date(doc.createdAt || Date.now()),
                backendDocId: doc.docId
              };
            });
            
            console.log("Converted documents:", documents);
            return documents;
          }
        }
      } catch (secondAttemptError) {
        console.warn("Second attempt failed:", secondAttemptError);
      }
      
      // If both attempts failed or returned no results, try without any filter
      console.log("Attempt 3: Fetching all documents without filter");
      try {
        const requestUrl = `${API_URL}/documents`;
        console.log(`Request URL: ${requestUrl}`);
        
        const response = await fetch(requestUrl, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
        });
        
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log("All documents from database:", data);
          
          if (data.results && Array.isArray(data.results)) {
            console.log(`Found ${data.results.length} total documents in database`);
            
            // Filter documents by corpusKey or corpusId on the client side
            const filteredDocs = data.results.filter((doc: any) => 
              doc.corpusId === corpusKey || doc.corpusKey === corpusKey
            );
            
            console.log(`Filtered to ${filteredDocs.length} documents for corpus ${corpusKey}`);
            
            if (filteredDocs.length > 0) {
              // Convert database documents to frontend format
              const documents: Document[] = filteredDocs.map((doc: any) => {
                console.log("Processing document:", doc);
                return {
                  id: doc.documentId || doc.docId,
                  fileName: doc.docName || doc.fileName || "Unknown Document",
                  fileType: doc.docType || "unknown",
                  corpusKey: doc.corpusId || corpusKey,
                  size: doc.size || 0,
                  uploadDate: new Date(doc.createdAt || Date.now()),
                  backendDocId: doc.docId
                };
              });
              
              console.log("Converted documents:", documents);
              return documents;
            }
          }
        }
      } catch (thirdAttemptError) {
        console.warn("Third attempt failed:", thirdAttemptError);
      }
      
      // If all attempts failed or returned no results
      console.log("No documents found in database for this corpus after all attempts");
      return [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  },

  uploadDocument: async (
    corpusKey: string,
    fileOrUrl: File | string,
    userId: string | null
  ): Promise<Document> => {
    console.log("🧪 VITE_API_KEY from env:", import.meta.env.VITE_API_KEY);
    const apiKey = import.meta.env.VITE_API_KEY;
    console.log("🔑 API key sent to backend:", apiKey);

    if (!userId) {
      throw new Error("User ID is required to upload documents");
    }

    const formData = new FormData();
    formData.append("corpus_key", corpusKey);
    formData.append("userId", userId);

    let isUrl = typeof fileOrUrl === "string";
    if (isUrl) {
      formData.append("url", fileOrUrl);
    } else {
      formData.append("file", fileOrUrl);
    }

    try {
      console.log("Sending request to:", `${API_URL}/process/document`);
      for (const [key, value] of formData.entries()) {
        console.log(`- ${key}: ${value instanceof File ? value.name : value}`);
      }

      const response = await fetch(`${API_URL}/process/document`, {
        method: 'POST',
        headers: {
          "X-API-KEY": apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error uploading document. Status:", response.status);
        console.error("Error response:", errorText);

        let errorMessage = "Failed to upload document";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Document upload response:", data);

      // Document for file and for url both
      // Extract document information from the response
      console.log("Extracting document information from response:", data);
      
      // Create a document object from the response data
      const newDocument: Document = {
        id: data.id || data.docId || data.documentId || `doc-${Date.now()}`,
        fileName: isUrl
          ? (data.fileName || data.docName || (typeof fileOrUrl === "string" ? fileOrUrl : "URL Document"))
          : (fileOrUrl instanceof File ? fileOrUrl.name : "Document"),
        fileType: isUrl
          ? "url"
          : (fileOrUrl instanceof File ? fileOrUrl.name.split('.').pop() || "unknown" : "unknown"),
        corpusKey,
        size: isUrl
          ? 0
          : (fileOrUrl instanceof File ? fileOrUrl.size : 0),
        uploadDate: new Date(data.createdAt || Date.now()),
        backendDocId: data.docId || data.id
      };
      
      console.log("Created document object:", newDocument);
      
      return newDocument;
    } catch (error) {
      console.error("Error in uploadDocument:", error);
      throw error;
    }
  },

  deleteDocument: async (documentId: string, corpusKey: string): Promise<void> => {
    console.log(`Deleting document: ${documentId} from corpus: ${corpusKey}`);
    const apiKey = import.meta.env.VITE_API_KEY;
    
    try {
      // STEP 1: Delete document chunks first
      console.log(`Deleting chunks for documentId: ${documentId}`);
      try {
        // First, get all chunks with this documentId
        const chunksResponse = await fetch(`${API_URL}/chunks?where=${encodeURIComponent(JSON.stringify({ documentId }))}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
        });
        
        if (chunksResponse.ok) {
          const chunksData = await chunksResponse.json();
          console.log(`Found ${chunksData.results?.length || 0} chunks for documentId: ${documentId}`);
          
          // Delete each chunk
          if (chunksData.results && Array.isArray(chunksData.results) && chunksData.results.length > 0) {
            for (const chunk of chunksData.results) {
              console.log(`Deleting chunk: ${chunk.chunkId}`);
              const deleteChunkResponse = await fetch(`${API_URL}/chunk/${chunk.chunkId}`, {
                method: 'DELETE',
                headers: {
                  "Content-Type": "application/json",
                  "X-API-KEY": apiKey,
                },
              });
              
              if (!deleteChunkResponse.ok) {
                console.warn(`Failed to delete chunk ${chunk.chunkId}:`, await deleteChunkResponse.text());
              } else {
                console.log(`Successfully deleted chunk ${chunk.chunkId}`);
              }
            }
          } else {
            console.log("No chunks found for this documentId");
          }
        } else {
          console.warn("Failed to fetch document chunks:", await chunksResponse.text());
        }
      } catch (chunkError) {
        console.error("Error deleting document chunks:", chunkError);
        // Continue with document deletion even if chunk deletion fails
      }
      
      // STEP 2: Find the document in the database to get its docId
      let dbDocId = null;
      try {
        console.log(`Finding document with documentId: ${documentId}`);
        const documentResponse = await fetch(`${API_URL}/documents?where=${encodeURIComponent(JSON.stringify({ documentId }))}`, {
          method: 'GET',
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
        });
        
        if (documentResponse.ok) {
          const documentData = await documentResponse.json();
          console.log("Document data:", documentData);
          
          if (documentData.results && Array.isArray(documentData.results) && documentData.results.length > 0) {
            dbDocId = documentData.results[0].docId;
            console.log(`Found document in database with docId: ${dbDocId}`);
          } else {
            console.warn(`Document with documentId ${documentId} not found in database`);
          }
        } else {
          console.warn("Failed to fetch document data:", await documentResponse.text());
        }
      } catch (findError) {
        console.error("Error finding document in database:", findError);
      }
      
      // STEP 3: Delete the document from the database
      let deletionSuccessful = false;
      
      if (dbDocId) {
        try {
          console.log(`Deleting document with docId: ${dbDocId}`);
          const response = await fetch(`${API_URL}/document/${dbDocId}`, {
            method: 'DELETE',
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": apiKey,
            },
          });
          
          if (response.ok) {
            console.log(`Document with docId ${dbDocId} deleted successfully from database`);
            deletionSuccessful = true;
          } else {
            const errorText = await response.text();
            console.error("Error deleting document. Status:", response.status);
            console.error("Error response:", errorText);
            throw new Error(`Failed to delete document: ${errorText}`);
          }
        } catch (docError) {
          console.error("Error deleting document from database:", docError);
          throw docError;
        }
      } else {
        // Try direct deletion with the provided ID as a last resort
        try {
          console.log(`Trying direct deletion with ID: ${documentId}`);
          const response = await fetch(`${API_URL}/document/${documentId}`, {
            method: 'DELETE',
            headers: {
              "Content-Type": "application/json",
              "X-API-KEY": apiKey,
            },
          });
          
          if (response.ok) {
            console.log(`Document deleted successfully using direct ID: ${documentId}`);
            deletionSuccessful = true;
          } else {
            const errorText = await response.text();
            console.warn(`Direct deletion failed: ${errorText}`);
            throw new Error(`Failed to delete document: ${errorText}`);
          }
        } catch (directError) {
          console.error("Error with direct document deletion:", directError);
          throw directError;
        }
      }
      
      if (!deletionSuccessful) {
        throw new Error("Document deletion failed - could not delete from database");
      }
      
      console.log(`Document deletion process completed for ${documentId}`);
    } catch (error) {
      console.error("Error in deleteDocument:", error);
      throw error;
    }
  },

  // Search functionality
  search: async (
    corpusKey: string,
    query: string,
    top_k: number,
    threshold: number
  ): Promise<SearchResponse> => {
    const apiKey = import.meta.env.VITE_API_KEY;
  
    const requestBody = {
      question: query,
      top_k,
      model: "voyage-3-large", // Add default embedding model
      threshold: threshold, 
      corpusKey: corpusKey
    };
  
    try {
      console.log(`Sending search request for query: "${query}", top_k: ${top_k}, model: ${requestBody.model}`);
      
      const response = await fetch("/api/v1/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify(requestBody),
      });
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Search failed:", errorText);
        throw new Error(`Failed to perform search: ${errorText}`);
      }
    
      const data = await response.json();
      console.log("✅ Search response:", data);
      
      // Transform the API response to match our expected format
      // Adjust this transformation based on the actual structure of your backend response
      
      // Log the raw data structure to help debug
      console.log("Raw API response structure:", JSON.stringify(data, null, 2));
      
      let answer = "No answer available";
      
      // Check if we have a valid answer from the API
      if (data.answer) {
        answer = data.answer;
      } else if (Array.isArray(data.results) && data.results.length > 0) {
        // The backend returns results as an array, and we need to check if it's a string or object
        const firstResult = data.results[0];
        
        // Check if the result is a string
        if (typeof firstResult === 'string') {
          answer = firstResult;
        } 
        // Check if it's an object with content property
        else if (typeof firstResult === 'object' && firstResult !== null) {
          if (firstResult.content) {
            answer = firstResult.content;
          } else if (firstResult.text) {
            answer = firstResult.text;
          }
        }
        
        // Check if the answer is the default error message
        if (answer === "No answer available. Please try again later." || 
            answer === "No answer available. The service encountered an error." ||
            answer === "No answer available") {
          console.warn("Received default error message from backend");
          answer = "No answer available. The system couldn't generate a response. Please try a different query or try again later.";
        }
      }
      
      // Simplify the response handling to match what's expected from Postman
      
      // Create the final response object - directly use the data from the backend
      const searchResponse: SearchResponse = {
        // Use the answer directly from the response, or the first result if available
        answer: data.answer || (Array.isArray(data.results) && data.results.length > 0 ? data.results[0] : answer),
        
        // Convert results to the expected format
        results: Array.isArray(data.results) 
          ? data.results.map((result: any) => {
              if (typeof result === 'string') {
                return {
                  content: result,
                  metadata: {
                    source: "Generated Answer",
                    confidence: 100,
                  },
                };
              } else {
                return {
                  content: typeof result === 'object' ? (result.content || result.text || JSON.stringify(result)) : String(result),
                  metadata: {
                    source: typeof result === 'object' ? (result.metadata?.source || "Generated Answer") : "Generated Answer",
                    confidence: 100,
                  },
                };
              }
            })
          : [],
        
        // Use source documents directly or extract from chunks
        sourceDocuments: Array.isArray(data.sources) 
          ? data.sources 
          : ["Generated Response"],
        
        // Pass chunks directly
        chunks: Array.isArray(data.chunks) ? data.chunks : undefined,
      };
    
      return searchResponse;
    } catch (error) {
      console.error("Error in search function:", error);
      throw error;
    }
  },
  
  // File export
  exportResults: async (format: string, content: string): Promise<Blob> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let mimeType = "text/plain";
    let data = content;
    
    switch (format.toLowerCase()) {
      case "pdf":
        mimeType = "application/pdf";
        // In a real app, we would generate a PDF here
        data = `%PDF-1.5\n%¥±ë\n\n1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n\n2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n\n3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>>\nendobj\n\n4 0 obj\n<</Length 10>>\nstream\n${content}\nendstream\nendobj\n\nxref\n0 5\n0000000000 65535 f \n0000000018 00000 n \n0000000063 00000 n \n0000000114 00000 n \n0000000189 00000 n \n\ntrailer\n<</Size 5/Root 1 0 R>>\nstartxref\n246\n%%EOF`;
        break;
      case "docx":
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        // In a real app, we would generate a DOCX here
        data = `Mock DOCX content for: ${content}`;
        break;
      case "csv":
        mimeType = "text/csv";
        // Convert content to CSV format
        data = `"Content"\n"${content.replace(/"/g, '""')}"`;
        break;
      case "json":
        mimeType = "application/json";
        // Convert content to JSON format
        data = JSON.stringify({ content });
        break;
    }
    
    return new Blob([data], { type: mimeType });
  },
};

// Helper function to handle API errors
export const handleApiError = (error: unknown) => {
  console.error("API Error:", error);
  
  toast.error("An error occurred", {
    description: error instanceof Error ? error.message : "Please try again later",
  });
  
  return Promise.reject(error);
};
