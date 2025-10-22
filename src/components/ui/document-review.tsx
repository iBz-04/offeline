import { FileText } from "lucide-react";
import "./document-review.css";

export default function DocumentReview() {
  return (
    <div className="document-review">
      <FileText className="w-5 h-5 text-primary" />
      <p className="text-xs text-muted-foreground">Reviewing document...</p>
    </div>
  );
}
