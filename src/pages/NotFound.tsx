import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  // Aapka yeh logic bahut accha hai debugging ke liye. Ise aise hi rehne denge.
  useEffect(() => {
    console.error(`404 Not Found: User attempted to access non-existent route: "${location.pathname}"`);
  }, [location.pathname]);

  return (
    // Yeh container aapke AppLayout ke andar aayega, isliye min-h-screen ki zaroorat nahi hai.
    // Hum isko vertically aur horizontally center kar rahe hain.
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 h-full">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" aria-hidden="true" />
      
      <h1 className="text-6xl font-bold text-foreground">
        404
      </h1>
      
      <p className="mt-2 text-2xl font-semibold text-foreground">
        Page Not Found
      </p>
      
      <p className="mt-2 max-w-md text-base text-muted-foreground">
        Oops! The page you are looking for does not exist, might have been removed, or is temporarily unavailable.
      </p>

      {/* Yeh user ko batayega ki usne kya galat type kiya */}
      <p className="mt-4 text-sm text-muted-foreground">
        You tried to access: <code className="bg-muted px-2 py-1 rounded-md">{location.pathname}</code>
      </p>

      <Button asChild className="mt-8">
        {/* 'a' tag ki jagah 'Link' ka istemal karein taaki page refresh na ho */}
        <Link to="/">
          Return to Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;