
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  BookOpen,
  MessageSquare,
  Menu,
  X,
  LogOut,
  User,
  Home,
} from "lucide-react";

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: <Home className="h-5 w-5" /> },
    ...(isAuthenticated
      ? [
          {
            name: "Knowledge Base",
            path: "/knowledge-base",
            icon: <BookOpen className="h-5 w-5" />,
          },
          {
            name: "Chat",
            path: "/chat",
            icon: <MessageSquare className="h-5 w-5" />,
          },
        ]
      : []),
  ];

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="rounded-full bg-gradient-to-r from-ragify-primary to-ragify-accent p-1">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="hidden text-xl font-bold sm:inline-block">
            RAG-ify
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Authentication Buttons - Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Hello, {user?.username || "User"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 sm:w-80">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between border-b pb-4">
                <Link
                  to="/"
                  className="flex items-center space-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="rounded-full bg-gradient-to-r from-ragify-primary to-ragify-accent p-1">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold">RAG-ify</span>
                </Link>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </SheetClose>
              </div>

              <nav className="flex flex-col space-y-4 py-6">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.name}>
                    <Link
                      to={item.path}
                      className="flex items-center space-x-2 text-sm font-medium transition-colors hover:text-foreground"
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-auto border-t pt-4">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="rounded-full bg-muted p-1">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/login">Login</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild className="w-full">
                        <Link to="/signup">Sign Up</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;
