
import { useState } from "react";
import { api, ChatMessage, SearchResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ArrowUpCircle,
  Loader2,
  Send,
  Bot,
  User,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

import ResultDisplay from "./ResultDisplay";

interface ChatInterfaceProps {
  corpora: { key: string; name: string }[];
}

const ChatInterface = ({ corpora }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [selectedCorpus, setSelectedCorpus] = useState<string>("");
  const [semanticSearchValue, setSemanticSearchValue] = useState<number>(75);
  const [thresholdValue, setThresholdValue] = useState<number>(0.5);
  const [isSearching, setIsSearching] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<SearchResponse | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim() || !selectedCorpus) {
      toast({
        title: "Missing information",
        description: "Please enter a query and select a corpus.",
        variant: "destructive",
      });
      return;
    }

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      content: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsSearching(true);

    try {
      console.log(`Searching corpus: ${selectedCorpus}`);
      console.log(`Query: "${query}"`);
      console.log(`Semantic value (top_k): ${semanticSearchValue}`);
      console.log(`Threshold value: ${thresholdValue}`);
      console.log("Using embedding model: voyage-3-large");
      
      // Add a timestamp to help correlate frontend and backend logs
      const searchTimestamp = new Date().toISOString();
      console.log(`Search request timestamp: ${searchTimestamp}`);
      
      const result = await api.search(
        selectedCorpus,
        query,
        semanticSearchValue,
        thresholdValue
      );
      
      console.log("Search results:", result);
      
      // Create system message directly from the answer
      // This should match what you see in Postman
      const newSystemMessage: ChatMessage = {
        id: `msg-${Date.now()}-system`,
        role: "system",
        content: result.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, newSystemMessage]);
      setCurrentResponse(result);
      setQuery("");
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to retrieve results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3">
          <label className="text-sm font-medium mb-2 block">
            Corpus Selection
          </label>
          <Select value={selectedCorpus} onValueChange={setSelectedCorpus}>
            <SelectTrigger className={corpora.length === 0 ? "border-amber-500" : ""}>
              <SelectValue placeholder={corpora.length > 0 ? "Select a corpus" : "No corpus available"} />
            </SelectTrigger>
            <SelectContent>
              {corpora.length > 0 ? (
                corpora.map((corpus) => (
                  <SelectItem key={corpus.key} value={corpus.key}>
                    {corpus.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-4 text-center">
                  <div className="text-sm font-medium text-amber-500">No corpus available</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Go to Knowledge Base to upload your first document.
                  </div>
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">
            Top K ({semanticSearchValue})
          </label>
          <Slider
            value={[semanticSearchValue]}
            min={1}
            max={100}
            step={1}
            onValueChange={(values) => setSemanticSearchValue(values[0])}
            className={`py-4 ${corpora.length === 0 ? "opacity-50" : ""}`}
            disabled={corpora.length === 0}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">
          Similarity Score ({thresholdValue.toFixed(2)})
        </label>
        <Slider
          value={[thresholdValue]}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(values) => setThresholdValue(values[0])}
          className={`py-4 ${corpora.length === 0 ? "opacity-50" : ""}`}
          disabled={corpora.length === 0}
        />
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {corpora.length === 0 ? "No documents available" : "Start a conversation"}
            </h3>
            {corpora.length === 0 ? (
              <div>
                <p className="text-amber-500 font-medium mb-2">
                  You need to upload documents before you can chat
                </p>
                <p className="text-muted-foreground max-w-sm mb-6">
                  Go to the Knowledge Base page to create a corpus and upload your first document.
                </p>
                <Button 
                  variant="default" 
                  className="animate-pulse"
                  onClick={() => window.location.href = "/knowledge-base"}
                >
                  Go to Knowledge Base
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground max-w-sm">
                Select a corpus and ask a question about your documents to get intelligent
                answers powered by RAG technology.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-3xl p-4 rounded-lg ${
                  msg.role === "user"
                    ? "bg-ragify-primary text-white"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {msg.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">
                    {msg.role === "user" ? "You" : "RAG-ify"}
                  </span>
                </div>
                <div className="whitespace-pre-wrap prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {/* {msg.content} */}
                </div>
                <div className="text-xs opacity-70 text-right mt-2">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {isSearching && (
          <div className="flex justify-start">
            <div className="max-w-3xl p-4 rounded-lg bg-muted">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>RAG-ify is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentResponse && (
        <ResultDisplay response={currentResponse} />
      )}

      <div className="sticky bottom-0 bg-background pt-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => window.scrollTo(0, 0)}
          >
            <ArrowUpCircle className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex items-center gap-2 border rounded-lg px-3 py-1 bg-background">
            <Input
              className="flex-1 border-none shadow-none focus-visible:ring-0"
              placeholder={corpora.length === 0 ? "Upload documents first..." : "Ask about your documents..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isSearching && selectedCorpus && query.trim() && handleSearch()}
              disabled={isSearching || corpora.length === 0 || !selectedCorpus}
              title={corpora.length === 0 ? "Go to Knowledge Base to upload documents first" : !selectedCorpus ? "Select a corpus first" : ""}
            />
            <Button
              size="icon"
              variant="ghost"
              className={`shrink-0 ${query.trim() && selectedCorpus ? "text-ragify-primary" : "text-muted-foreground"}`}
              disabled={!query.trim() || isSearching || !selectedCorpus || corpora.length === 0}
              onClick={handleSearch}
              title={
                corpora.length === 0 
                  ? "Go to Knowledge Base to upload documents first" 
                  : !selectedCorpus 
                    ? "Select a corpus first" 
                    : !query.trim() 
                      ? "Type a question" 
                      : "Send message"
              }
            >
              {isSearching ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
