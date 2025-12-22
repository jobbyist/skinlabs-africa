import { AlertCircle } from "lucide-react";

const REOPEN_DATE = "7th January 2026";

const NotificationBar = () => {
  return (
    <div className="bg-primary text-primary-foreground py-3 px-4 text-center">
      <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm md:text-base font-medium">
          <strong>Site Maintenance Notice:</strong> We're currently upgrading our website, which is causing limited functionality. 
          We will not be accepting new orders until we reopen for business on <strong>{REOPEN_DATE}</strong>. 
          Find our products exclusively on <a href="https://www.takealot.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">Takealot</a> until we reopen.
        </p>
      </div>
    </div>
  );
};

export default NotificationBar;
