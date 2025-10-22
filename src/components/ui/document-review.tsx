import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export default function DocumentReview() {
  return (
    <motion.div 
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <FileText className="w-5 h-5 text-primary" />
      </motion.div>
      <motion.p 
        className="text-xs text-muted-foreground"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Reviewing document...
      </motion.p>
    </motion.div>
  );
}
