
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, Corpus } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import ChatInterface from "@/components/ChatInterface";
import { Loader2 } from "lucide-react";

const Chat = () => {
  const { isAuthenticated, isLoading: authLoading, userId } = useAuth();
  const [corpora, setCorpora] = useState<Corpus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCorpora = async () => {
      setIsLoading(true);
      try {
        // Pass userId to filter corpora by user
        const corporaData = await api.getAllCorpora(userId);
        setCorpora(corporaData);
      } catch (error) {
        console.error("Error fetching corpora:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && userId) {
      fetchCorpora();
    }
  }, [isAuthenticated, userId]);

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

      <div className="container px-4 md:px-6 py-8 flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Chat with Your Documents</h1>
          <p className="text-muted-foreground">
            Ask questions about documents in your knowledge base
          </p>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-ragify-primary" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ChatInterface
              corpora={corpora.map(c => ({ key: c.key, name: c.name }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
