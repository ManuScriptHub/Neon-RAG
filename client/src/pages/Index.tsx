
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import {
  BookOpen,
  Database,
  MessageSquareText,
  ArrowRight,
  Bot,
  FileText,
  Search,
  Upload,
} from "lucide-react";

const Index = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <Upload className="h-6 w-6 text-ragify-primary" />,
      title: "Document Upload",
      description:
        "Upload various document types including PDFs, Word docs, text files and more to build your knowledge base.",
    },
    {
      icon: <Database className="h-6 w-6 text-ragify-primary" />,
      title: "Corpus Management",
      description:
        "Organize your documents into topic-focused corpora for better context and more accurate responses.",
    },
    {
      icon: <Search className="h-6 w-6 text-ragify-primary" />,
      title: "Semantic Search",
      description:
        "Find information based on meaning, not just keywords, with adjustable semantic search precision.",
    },
    {
      icon: <MessageSquareText className="h-6 w-6 text-ragify-primary" />,
      title: "AI-Powered Chat",
      description:
        "Ask questions about your documents and receive intelligent answers with source citations.",
    },
    {
      icon: <FileText className="h-6 w-6 text-ragify-primary" />,
      title: "Result Export",
      description:
        "Export search results in various formats including PDF, Word, CSV, and JSON.",
    },
    {
      icon: <Bot className="h-6 w-6 text-ragify-primary" />,
      title: "RAG Technology",
      description:
        "Leverage Retrieval Augmented Generation for accurate, context-aware responses based on your data.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Transform Your Documents into
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-ragify-primary to-ragify-accent">
                      {" "}
                      Interactive Knowledge
                    </span>
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                    RAG-ify uses Retrieval Augmented Generation to create an
                    intelligent system that can answer questions based on your
                    documents with precision and context awareness.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-ragify-primary to-ragify-accent hover:opacity-90"
                    asChild
                  >
                    <Link to={isAuthenticated ? "/chat" : "/signup"}>
                      {isAuthenticated ? "Start Chatting" : "Get Started"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link to={isAuthenticated ? "/knowledge-base" : "/login"}>
                      {isAuthenticated ? "Manage Knowledge Base" : "Login"}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <div className="absolute top-0 left-0 w-40 h-40 bg-ragify-primary/20 rounded-full filter blur-3xl opacity-50" />
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-ragify-accent/20 rounded-full filter blur-3xl opacity-50" />
                  <div className="relative border rounded-xl shadow-lg bg-white p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="rounded-full bg-gradient-to-r from-ragify-primary to-ragify-accent p-1">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-lg font-medium">RAG-ify Chat</span>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-end">
                        <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg max-w-xs">
                          <p className="text-sm">
                            Can you summarize the key points from my financial
                            reports?
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2 rounded-lg max-w-xs">
                          <p className="text-sm">
                            Based on your financial reports, the key points are:
                            1) Revenue increased by 18% year-over-year
                            2) Operating expenses reduced by 5%
                            3) New market expansion showing 27% growth
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-lg max-w-xs">
                          <p className="text-sm">
                            What were the main factors driving the revenue
                            increase?
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 px-4 py-2 rounded-lg max-w-xs">
                          <p className="text-sm">
                            According to your Q4 analysis report, the main
                            factors were the launch of the new product line
                            (40% of growth) and expansion into Asian markets
                            (35% of growth).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Powerful Features for Document Intelligence
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl dark:text-gray-400">
                  RAG-ify combines document management with advanced AI to create
                  a powerful knowledge retrieval system.
                </p>
              </div>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center space-y-2 border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="p-2 rounded-full bg-blue-50">{feature.icon}</div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-gray-500 text-center">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-slate-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  How RAG-ify Works
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl dark:text-gray-400">
                  A simple process to transform your documents into an
                  intelligent knowledge base
                </p>
              </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3 mt-12">
              <div className="relative flex flex-col items-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ragify-primary text-white">
                  <span className="text-xl font-bold">1</span>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold">Upload Documents</h3>
                  <p className="text-gray-500">
                    Add your documents to different corpora based on their content and purpose
                  </p>
                </div>
                <div className="absolute top-7 left-full w-full hidden md:block border-t-2 border-dashed border-gray-200" />
              </div>

              <div className="relative flex flex-col items-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ragify-primary text-white">
                  <span className="text-xl font-bold">2</span>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold">Ask Questions</h3>
                  <p className="text-gray-500">
                    Query your documents with natural language questions using the chat interface
                  </p>
                </div>
                <div className="absolute top-7 left-full w-full hidden md:block border-t-2 border-dashed border-gray-200" />
              </div>

              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ragify-primary text-white">
                  <span className="text-xl font-bold">3</span>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-xl font-bold">Get Answers</h3>
                  <p className="text-gray-500">
                    Receive accurate answers with citations and sources from your document base
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                  Ready to Transform Your Documents?
                </h2>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  Start using RAG-ify today and unlock the knowledge hidden in
                  your documents.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-ragify-primary to-ragify-accent hover:opacity-90"
                  asChild
                >
                  <Link to={isAuthenticated ? "/knowledge-base" : "/signup"}>
                    {isAuthenticated ? "Go to Dashboard" : "Sign Up Now"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t py-6 bg-slate-50">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-gradient-to-r from-ragify-primary to-ragify-accent p-1">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">RAG-ify</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} RAG-ify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
