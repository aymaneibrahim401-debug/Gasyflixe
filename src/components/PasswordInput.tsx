import { useState, forwardRef } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  showHint?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, Props>(
  ({ showHint, className, value, onFocus, onBlur, ...props }, ref) => {
    const [visible, setVisible] = useState(false);
    const [focused, setFocused] = useState(false);
    const v = (value as string) || "";
    const checks = [
      { ok: /[A-Z]/.test(v), label: "ABC", hint: "Une majuscule" },
      { ok: /[0-9]/.test(v), label: "123", hint: "Un chiffre" },
      { ok: /[\W_]/.test(v), label: "@#$", hint: "Un symbole" },
      { ok: v.length >= 8, label: "8+", hint: "8 caractères min" },
    ];
    const showRules = showHint && (focused || v.length > 0);
    return (
      <div className="space-y-2">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            value={value}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            className={cn(focused || v.length > 0 ? "pr-10" : "", "bg-background", className)}
            {...props}
          />
          {(focused || v.length > 0) && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setVisible(!visible)}
              tabIndex={-1}
              aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {showRules && (
          <div className="flex flex-wrap gap-2 text-xs">
            {checks.map((c) => (
              <span
                key={c.label}
                title={c.hint}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-sm border transition-colors font-mono",
                  c.ok
                    ? "border-primary/40 text-primary bg-primary/10"
                    : "border-destructive/40 text-destructive bg-destructive/5"
                )}
              >
                {c.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {c.label}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";
