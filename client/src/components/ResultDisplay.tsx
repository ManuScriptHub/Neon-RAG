
import { useState } from "react";
import { api, SearchResponse } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Download,
  FileText,
  BarChart2,
  FileSpreadsheet,
  Code,
  ChevronDown,
  ExternalLink,
  Check,
  File,
} from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface ResultDisplayProps {
  response: SearchResponse;
}

const ResultDisplay = ({ response }: ResultDisplayProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeExportFormat, setActiveExportFormat] = useState<string>("text");
  const [maxChunksToShow, setMaxChunksToShow] = useState<number>(5);
  const { toast } = useToast();

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence)}%`;
  };

  const handleExport = async (format: string) => {
    setIsDownloading(true);
    setActiveExportFormat(format);

    try {
      const content = response.answer + "\n\nSources:\n" + 
        response.sourceDocuments.join("\n");
      
      const blob = await api.exportResults(format, content);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `ragify-results.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: `Results exported as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export results.",
        variant: "destructive",
      });
      console.error("Export error:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const filterResults = () => {
    if (!searchTerm) return response.results;
    
    const lowercasedTerm = searchTerm.toLowerCase();
    return response.results.filter(
      result => result.content.toLowerCase().includes(lowercasedTerm)
    );
  };

  const highlightText = (text: string, term: string) => {
    if (!term) return <ReactMarkdown>{text}</ReactMarkdown>;
    
    // For search highlights we'll use a simpler approach since ReactMarkdown 
    // doesn't easily support highlighting within its rendered content
    const regex = new RegExp(`(${term})`, "gi");
    const parts = text.split(regex);
    
    // Return the text with search terms highlighted and the rest as Markdown
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? 
            <span key={i} className="bg-yellow-200 dark:bg-yellow-700">{part}</span> : 
            <ReactMarkdown key={i}>{part}</ReactMarkdown>
        )}
      </>
    );
  };

  const filteredResults = filterResults();

  return (
    <div className="mb-6">
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-xl">Search Results</CardTitle>
            <CardDescription className="mt-1">
              Found {response.results.length} results from{" "}
              {response.sourceDocuments.length} documents
            </CardDescription>
          </div>

          <div className="flex flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="w-full pl-8 md:w-[200px]"
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-1">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("text")} disabled={isDownloading}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Text (.txt)</span>
                  {activeExportFormat === "text" && isDownloading && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pdf")} disabled={isDownloading}>
                  <File className="mr-2 h-4 w-4" />
                  <span>PDF Document (.pdf)</span>
                  {activeExportFormat === "pdf" && isDownloading && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")} disabled={isDownloading}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Word Document (.docx)</span>
                  {activeExportFormat === "docx" && isDownloading && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("csv")} disabled={isDownloading}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  <span>CSV Spreadsheet (.csv)</span>
                  {activeExportFormat === "csv" && isDownloading && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")} disabled={isDownloading}>
                  <Code className="mr-2 h-4 w-4" />
                  <span>JSON Data (.json)</span>
                  {activeExportFormat === "json" && isDownloading && (
                    <span className="ml-auto flex h-4 w-4 items-center justify-center">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Answer section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Generated Answer</h3>
              <Badge variant="outline" className="text-xs">AI Generated</Badge>
            </div>
            <div className="p-4 bg-muted/30 border rounded-md text-sm prose dark:prose-invert max-w-none">
              <ReactMarkdown>{response.answer}</ReactMarkdown>
            </div>
          </div>
          
          {/* Chunks section */}
          {response.chunks && response.chunks.length > 0 && (() => {
            // Process chunks once to avoid repeated filtering
            const relevantChunks = response.chunks
              .filter(chunk => chunk[2] >= 0.5) // Only show chunks with at least 50% similarity
              .sort((a, b) => b[2] - a[2]); // Sort by similarity score (highest first)
            
            // If no chunks meet the relevance threshold, show all chunks sorted by relevance
            const chunksToDisplay = relevantChunks.length > 0 
              ? relevantChunks 
              : response.chunks.sort((a, b) => b[2] - a[2]);
            
            return (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold">
                    {relevantChunks.length > 0 ? "Top Relevant Chunks" : "All Chunks (Sorted by Relevance)"}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {chunksToDisplay.length} chunks
                  </Badge>
                </div>
                
                {chunksToDisplay.length === 0 ? (
                  <div className="p-3 bg-muted/50 border rounded-md text-xs text-center">
                    No chunks available
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                    {chunksToDisplay
                      .slice(0, maxChunksToShow)
                      .map((chunk, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 border rounded-md text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">Chunk #{chunk[0]}</span>
                            <Badge 
                              variant={chunk[2] >= 0.7 ? "default" : chunk[2] >= 0.5 ? "outline" : "secondary"} 
                              className="ml-2"
                            >
                              {Math.round(chunk[2] * 100)}% match
                            </Badge>
                          </div>
                          <p className="text-muted-foreground whitespace-pre-wrap">{chunk[1]}</p>
                        </div>
                      ))}
                  </div>
                )}
                
                {chunksToDisplay.length > maxChunksToShow && (
                  <div className="flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setMaxChunksToShow(prev => prev + 5)}
                      className="text-xs"
                    >
                      Show 5 more chunks
                    </Button>
                  </div>
                )}
                
                {maxChunksToShow > 5 && chunksToDisplay.length > 5 && (
                  <div className="flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setMaxChunksToShow(5)}
                      className="text-xs"
                    >
                      Show fewer chunks
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Search results in a fixed-height scrollable container */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">Source Documents</h3>
              <Badge variant="secondary" className="text-xs">
                {filteredResults.length} results
              </Badge>
            </div>
            <div className="max-h-[400px] overflow-y-auto pr-2 border rounded-md p-3">
              <Accordion type="multiple" className="space-y-2">
                {filteredResults.map((result, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border rounded-md overflow-hidden"
                  >
                <AccordionTrigger className="px-4 py-2 hover:no-underline">
                  <div className="flex flex-col items-start text-left gap-1 w-full">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{result.metadata.source}</span>
                        {result.metadata.page && (
                          <Badge variant="outline" className="text-xs">
                            Page {result.metadata.page}
                          </Badge>
                        )}
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              <BarChart2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs font-medium">
                                {formatConfidence(result.metadata.confidence)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Confidence score</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {result.content}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="p-3 bg-muted rounded-md text-sm prose dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap">
                      {highlightText(result.content, searchTerm)}
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <ExternalLink className="h-3 w-3" />
                      <span>Go to source</span>
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            
            {filteredResults.length === 0 && (
              <div className="flex justify-center p-8 text-center">
                <div>
                  <Search className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-1">No matching results</h3>
                  <p className="text-muted-foreground mb-3">
                    Try a different search term or clear your search
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear search
                  </Button>
                </div>
              </div>
            )}
              </Accordion>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultDisplay;
