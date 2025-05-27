import { useState } from "react";
import { api, Document } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  File,
  FileCode,
  FileImage,
  FileSpreadsheet,
  MoreVertical,
  Trash2,
  Download,
  Eye,
} from "lucide-react";

interface CorpusTableProps {
  documents: Document[];
  corpusKey: string;
  onDocumentDeleted: () => void;
}

const CorpusTable = ({
  documents,
  corpusKey,
  onDocumentDeleted,
}: CorpusTableProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "url":
        return <FileCode className="h-4 w-4 text-yellow-500" />;
      case "docx":
      case "doc":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "txt":
        return <FileText className="h-4 w-4 text-gray-500" />;
      case "csv":
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FileImage className="h-4 w-4 text-purple-500" />;
      case "json":
      case "xml":
      case "html":
        return <FileCode className="h-4 w-4 text-orange-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    
    setIsDeleting(true);
    try {
      await api.deleteDocument(documentToDelete.id, corpusKey);
      toast({
        title: "Document deleted",
        description: `"${documentToDelete.fileName}" has been removed.`,
      });
      
      // Force a refresh of the document list from the database
      onDocumentDeleted();
    } catch (error) {
      console.error("Error in document deletion:", error);
      
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Failed to delete document: ${error.message}` 
          : "There was an issue deleting the document. Please try again.",
        variant: "destructive",
      });
      
      // Still refresh the UI to show the current state from the database
      onDocumentDeleted();
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            No documents found in this corpus
          </CardDescription>
        </CardHeader>
        <CardContent className="h-32 flex items-center justify-center text-center">
          <div className="text-muted-foreground">
            <p>Upload documents to start using RAG capabilities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          {documents.length} document{documents.length !== 1 && "s"} in this corpus
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                {/* <TableHead className="hidden md:table-cell">Size</TableHead> */}
                <TableHead className="hidden sm:table-cell">Uploaded</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(doc.fileType)}
                      <span className="truncate max-w-[180px] md:max-w-[300px]">
                        {doc.fileName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell uppercase text-xs">
                    {doc.fileType}
                  </TableCell>
                  {/* <TableCell className="hidden md:table-cell">
                    {formatFileSize(doc.size)}
                  </TableCell> */}
                  <TableCell className="hidden sm:table-cell">
                    {formatDate(doc.uploadDate)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          <span>Preview</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Download className="mr-2 h-4 w-4" />
                          <span>Download</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="flex items-center text-destructive"
                          onClick={() => handleDeleteClick(doc)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CorpusTable;
