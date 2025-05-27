
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { api, Corpus, Document } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import DocumentUpload from "@/components/DocumentUpload";
import CorpusTable from "@/components/CorpusTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const KnowledgeBase = () => {
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth();
  const { toast } = useToast();
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [activeCorpus, setActiveCorpus] = useState<string>("");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCorpora = async () => {
      setIsLoading(true);
      try {
        // Pass userId to filter corpora by user
        const corporaData = await api.getAllCorpora(userId);
        setCorpora(corporaData);
        
        if (corporaData.length > 0 && !activeCorpus) {
          setActiveCorpus(corporaData[0].key);
          // Save active corpus to localStorage
          if (userId) {
            localStorage.setItem(`ragify-active-corpus-${userId}`, corporaData[0].key);
          }
        }
      } catch (error) {
        console.error("Error fetching corpora:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && userId) {
      // Try to get the active corpus from localStorage
      const savedActiveCorpus = localStorage.getItem(`ragify-active-corpus-${userId}`);
      if (savedActiveCorpus) {
        setActiveCorpus(savedActiveCorpus);
      }
      
      fetchCorpora();
    }
  }, [isAuthenticated, userId, refreshTrigger, activeCorpus]);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!activeCorpus) return;
      
      setIsLoading(true);
      try {
        console.log(`Fetching documents for corpus: ${activeCorpus} (refresh: ${refreshTrigger})`);
        // Clear any cached documents first
        setDocuments([]);
        
        // Force a fresh fetch from the database
        const documentsData = await api.getDocumentsByCorpus(activeCorpus);
        console.log(`Fetched ${documentsData.length} documents for corpus: ${activeCorpus}`);
        setDocuments(documentsData);
        
        if (documentsData.length === 0) {
          toast({
            title: "No documents found",
            description: "No documents were found for this corpus. Try uploading a document.",
          });
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        setDocuments([]);
        // Show error toast
        toast({
          title: "Error fetching documents",
          description: error instanceof Error 
            ? `Could not retrieve documents: ${error.message}` 
            : "Could not retrieve documents from the database. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (activeCorpus && isAuthenticated) {
      fetchDocuments();
    }
  }, [activeCorpus, isAuthenticated, refreshTrigger]);

  const handleRefresh = () => {
    console.log("Refreshing document list...");
    // Increment the refresh trigger to force a re-fetch
    setRefreshTrigger(prev => prev + 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-ragify-primary" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Upload, organize and manage documents for your RAG system
            </p>
          </div>

          {/* Upload Section */}
          <DocumentUpload
            corpora={corpora.map(c => ({ key: c.key, name: c.name }))}
            onDocumentUploaded={handleRefresh}
          />

          {/* Corpus Tabs & Documents */}
          {isLoading && corpora.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-ragify-primary" />
            </div>
          ) : corpora.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Create your first corpus to start uploading documents
                </CardDescription>
              </CardHeader>
              <CardContent className="h-32 flex items-center justify-center text-center">
                <div className="text-muted-foreground max-w-md">
                  <p>
                    Use the "New" button next to the corpus dropdown in the upload section
                    to create your first corpus. Then you can upload documents into it.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Tabs 
              value={activeCorpus} 
              onValueChange={(value) => {
                setActiveCorpus(value);
                // Save active corpus to localStorage
                if (userId) {
                  localStorage.setItem(`ragify-active-corpus-${userId}`, value);
                }
              }}>
              <TabsList className="mb-6 flex flex-wrap">
                {corpora.map((corpus) => (
                  <TabsTrigger key={corpus.key} value={corpus.key}>
                    {corpus.name}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
                      {corpus.documentCount}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {corpora.map((corpus) => (
                <TabsContent key={corpus.key} value={corpus.key}>
                  <CorpusTable
                    documents={documents}
                    corpusKey={corpus.key}
                    onDocumentDeleted={handleRefresh}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
