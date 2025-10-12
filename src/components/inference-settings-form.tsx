"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import useChatStore, { InferenceSettings } from "@/hooks/useChatStore";
import { toast } from "sonner";
import { Zap, Database, Thermometer, Target } from "lucide-react";

const inferenceSettingsSchema = z.object({
  contextWindowSize: z.coerce
    .number()
    .min(512, "Must be at least 512")
    .max(8192, "Cannot exceed 8192"),
  maxTokens: z.coerce
    .number()
    .min(128, "Must be at least 128")
    .max(8000, "Cannot exceed 8000"),
  temperature: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(2, "Cannot exceed 2"),
  topP: z.coerce
    .number()
    .min(0, "Must be at least 0")
    .max(1, "Cannot exceed 1"),
});

interface InferenceSettingsFormProps {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function InferenceSettingsForm({
  setOpen,
}: InferenceSettingsFormProps) {
  const inferenceSettings = useChatStore((state) => state.inferenceSettings);
  const setInferenceSettings = useChatStore(
    (state) => state.setInferenceSettings
  );

  const form = useForm<InferenceSettings>({
    resolver: zodResolver(inferenceSettingsSchema),
    defaultValues: inferenceSettings,
  });

  function onSubmit(data: InferenceSettings) {
    setInferenceSettings(data);
    toast.success("Inference settings updated successfully!");
    setOpen(false);
  }

  const resetToDefaults = () => {
    const defaults: InferenceSettings = {
      contextWindowSize: 4096,
      maxTokens: 2048,
      temperature: 0.6,
      topP: 0.9,
    };
    form.reset(defaults);
    setInferenceSettings(defaults);
    toast.success("Settings reset to defaults (optimized for speed)");
  };

  const setMaxPerformance = () => {
    const maxSettings: InferenceSettings = {
      contextWindowSize: 6144,
      maxTokens: 6000,
      temperature: 0.7,
      topP: 0.95,
    };
    form.reset(maxSettings);
    toast.info("Max performance preset applied");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="contextWindowSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Context Window Size
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="4096"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tokens for conversation history. Lower = faster. (Default: 4096)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxTokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Max Tokens
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="2048"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Maximum response length. Lower = faster. (Default: 2048)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="0.6"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Response randomness. Lower = faster & more focused. (Default: 0.6)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topP"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Top P (Nucleus Sampling)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.05"
                    placeholder="0.9"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Token selection threshold. 0.9 is optimal. (Default: 0.9)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="flex-1">
            Save Settings
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={resetToDefaults}
            className="flex-1"
          >
            Reset to Fast
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={setMaxPerformance}
            className="flex-1"
          >
            Max Quality
          </Button>
        </div>
      </form>
    </Form>
  );
}
