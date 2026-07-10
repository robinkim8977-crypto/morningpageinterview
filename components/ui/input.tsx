import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-pill border border-black bg-transparent px-6 text-center text-base outline-none transition focus:ring-2 focus:ring-black/20",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
