"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PasswordInput({ signup }: { signup?: boolean }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        id="password"
        name="password"
        type={visible ? "text" : "password"}
        required
        minLength={signup ? 6 : undefined}
        autoComplete={signup ? "new-password" : "current-password"}
        placeholder="Введіть пароль"
        className="h-10 pr-11"
        aria-describedby={signup ? "password-hint" : undefined}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-0 right-0"
        aria-label={visible ? "Приховати пароль" : "Показати пароль"}
        onClick={() => setVisible(!visible)}
      >
        <Icon aria-hidden="true" />
      </Button>
    </div>
  );
}
