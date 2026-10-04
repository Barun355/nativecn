import { useState } from "react";

import { FormField } from "@/registry/components/form-field";
import { Input } from "@/registry/components/input";
import { FocusChain } from "@/registry/components/primitives/focus-chain";

export function FormFieldDemo() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  const submit = () => setError(email.includes("@") ? undefined : "Enter a valid email");

  return (
    <FocusChain onSubmit={submit}>
      <FormField label="Email" description="We never share it." error={error} required>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
      </FormField>
      <FormField label="Password" required>
        <Input secureTextEntry autoComplete="current-password" />
      </FormField>
    </FocusChain>
  );
}
