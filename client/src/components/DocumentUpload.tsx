import { useState } from "react";
import { api } from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  FileUp,
  Upload,
  PlusCircle,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DocumentUploadProps {
  corpora: { key: string; name: string }[];
  onDocumentUploaded: () => void;
}

const isValidHttpUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const DocumentUpload = ({
  corpora,
  onDocumentUploaded,
}: DocumentUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCorpus, setSelectedCorpus] = useState<string>("");
  const [newCorpusName, setNewCorpusName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingCorpus, setIsCreatingCorpus] = useState(false);
  const [createCorpusDialogOpen, setCreateCorpusDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const { toast } = useToast();
  const { userId } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCreateCorpus = async () => {
    if (!newCorpusName.trim()) return;

    setIsCreatingCorpus(true);
    try {
      // Pass userId when creating a corpus
      const newCorpus = await api.createCorpus(newCorpusName, userId);
      
      // Save the active corpus to localStorage
      if (userId) {
        localStorage.setItem(`ragify-active-corpus-${userId}`, newCorpus.key);
      }
      
      toast({
        title: "Corpus created",
        description: `"${newCorpusName}" corpus has been created successfully.`,
      });
      setNewCorpusName("");
      setCreateCorpusDialogOpen(false);
      onDocumentUploaded();
    } catch (error) {
      toast({
        title: "Error creating corpus",
        description: "Failed to create corpus. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCorpus(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedCorpus) {
      toast({
        title: "Missing information",
        description: "Please select a corpus before uploading.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === "file" && !selectedFile) {
      toast({
        title: "Missing file",
        description: "Please select a file before uploading.",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === "url" && !urlInput.trim()) {
      toast({
        title: "Missing URL",
        description: "Please enter a URL before uploading.",
        variant: "destructive",
      });
      return;
    }

    if (uploadMode === "url" && !isValidHttpUrl(urlInput.trim())) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (must start with http or https).",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      if (uploadMode === "file" && selectedFile) {
        await api.uploadDocument(selectedCorpus, selectedFile, userId);
        toast({
          title: "Document uploaded",
          description: `"${selectedFile.name}" has been uploaded successfully.`,
        });
        setSelectedFile(null);
      } else if (uploadMode === "url" && urlInput.trim()) {
        await api.uploadDocument(selectedCorpus, urlInput.trim(), userId);
        toast({
          title: "URL processed",
          description: `Content from "${urlInput.trim()}" has been uploaded successfully.`,
        });
        setUrlInput("");
      }
      
      // Save the active corpus to localStorage
      if (userId) {
        localStorage.setItem(`ragify-active-corpus-${userId}`, selectedCorpus);
      }
      
      onDocumentUploaded();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document or URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Upload Document</CardTitle>
        <CardDescription>
          Add documents or URLs to your knowledge base for RAG processing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-4">
          <div className="grid gap-2">
            <Label htmlFor="corpus">Corpus</Label>
            <div className="flex w-full gap-2">
              <Select value={selectedCorpus} onValueChange={setSelectedCorpus}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={corpora.length > 0 ? "Select a corpus" : "No corpus available"} />
                </SelectTrigger>
                <SelectContent>
                  {corpora.length > 0 ? (
                    corpora.map((corpus) => (
                      <SelectItem key={corpus.key} value={corpus.key} className="cursor-pointer">
                        {corpus.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-center">
                      <div className="text-sm font-medium text-muted-foreground">No corpus available</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Click the "Create Corpus" button to create your first corpus
                      </div>
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Dialog
                open={createCorpusDialogOpen}
                onOpenChange={setCreateCorpusDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button 
                    variant={corpora.length === 0 ? "default" : "outline"}
                    className={corpora.length === 0 ? "animate-pulse" : ""}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" /> 
                    {corpora.length === 0 ? "Create Corpus" : "New"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Corpus</DialogTitle>
                    <DialogDescription>
                      A corpus is a collection of documents with a common theme or purpose.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="corpus-name">Corpus Name</Label>
                      <Input
                        id="corpus-name"
                        placeholder="Enter corpus name"
                        value={newCorpusName}
                        onChange={(e) => setNewCorpusName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setCreateCorpusDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCorpus}
                      disabled={!newCorpusName.trim() || isCreatingCorpus}
                    >
                      {isCreatingCorpus && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Corpus
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant={uploadMode === "file" ? "default" : "outline"}
              type="button"
              onClick={() => setUploadMode("file")}
              className="flex-1"
              disabled={corpora.length === 0}
              title={corpora.length === 0 ? "Create a corpus first" : ""}
            >
              Upload File
            </Button>
            <Button
              variant={uploadMode === "url" ? "default" : "outline"}
              type="button"
              onClick={() => setUploadMode("url")}
              className="flex-1"
              disabled={corpora.length === 0}
              title={corpora.length === 0 ? "Create a corpus first" : ""}
            >
              Upload via URL
            </Button>
          </div>

          {uploadMode === "file" ? (
            <div className="grid gap-2">
              <Label htmlFor="file">Document</Label>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div
                    className={`flex-1 rounded-md border border-dashed border-border p-6 transition-colors ${
                      selectedFile 
                        ? "border-primary bg-muted" 
                        : corpora.length === 0 
                          ? "bg-muted/50 cursor-not-allowed" 
                          : "cursor-pointer"
                    }`}
                    onClick={() => corpora.length > 0 && document.getElementById("file")?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileUp className="h-5 w-5 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center">
                        <Upload className="mb-2 h-10 w-10 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {corpora.length === 0 
                            ? "Create a corpus first" 
                            : "Click to upload a document"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {corpora.length === 0 
                            ? "Use the 'Create Corpus' button above to create your first corpus" 
                            : "PDF, DOCX, TXT, CSV files up to 50MB"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="url">Document URL</Label>
              <Input
                id="url"
                type="url"
                placeholder={corpora.length === 0 ? "Create a corpus first" : "Enter a valid URL (http(s)://...)"}
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                disabled={isUploading || corpora.length === 0}
                autoFocus={corpora.length > 0}
              />
              <div className="text-xs text-muted-foreground ml-1">
                {corpora.length === 0 
                  ? "Create a corpus first using the 'New' button above" 
                  : "Provide a publicly accessible URL to a document, e.g., https://example.com/my.pdf"}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full sm:w-auto"
          onClick={handleUpload}
          disabled={
            isUploading ||
            !selectedCorpus ||
            (uploadMode === "file" ? !selectedFile : !urlInput.trim())
          }
          title={!selectedCorpus ? "Please create or select a corpus first" : ""}
        >
          {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {corpora.length === 0 ? "Create a corpus first" : "Upload Document"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentUpload;
