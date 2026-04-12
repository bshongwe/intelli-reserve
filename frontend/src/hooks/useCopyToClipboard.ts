import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UseCopyToClipboardOptions {
  readonly successMessage?: string;
  readonly errorMessage?: string;
}

export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
) {
  const { toast } = useToast();
  const {
    successMessage = "Copied to clipboard",
    errorMessage = "Failed to copy",
  } = options;

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: successMessage });
        return true;
      } catch {
        toast({ title: errorMessage, variant: "destructive" });
        return false;
      }
    },
    [toast, successMessage, errorMessage]
  );

  return { copy };
}
