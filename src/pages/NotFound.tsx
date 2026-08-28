import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Helmet>
        <title>Page Not Found | SkinLabs</title>
        <meta name="description" content="This page has gone missing. Head back to SkinLabs for evidence-graded skincare reviews, daily briefings and an AI routine built for SA skin." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-heading font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">
            This page moved, got renamed, or never existed. Even the best routines have the odd dead link.
          </p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            Back to SkinLabs
          </a>
        </div>
      </div>
    </>
  );
};

export default NotFound;
