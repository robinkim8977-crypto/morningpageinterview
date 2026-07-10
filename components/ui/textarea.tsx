import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[300px] w-full resize-none rounded-none border-0 bg-transparent text-xl leading-9 outline-none placeholder:text-black/35 md:text-2xl",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
