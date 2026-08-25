import { cn } from "@/lib/cn";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export function CodeOtp({
  id,
  value,
  onChange,
  disabled,
  centered = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  centered?: boolean;
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      value={value}
      onChange={onChange}
      disabled={disabled}
      autoComplete="one-time-code"
      pushPasswordManagerStrategy="none"
      containerClassName={cn(centered && "justify-center")}
    >
      <InputOTPGroup className="gap-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <InputOTPSlot
            key={index}
            index={index}
            className="size-10 rounded-lg border-l first:rounded-lg last:rounded-lg"
          />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
