import { FormField } from "@/registry/components/form-field";
import { Textarea } from "@/registry/components/textarea";

export function TextareaDemo() {
  return (
    <FormField label="Bio" description="Tell people a little about yourself.">
      <Textarea placeholder="I like…" maxLength={160} minRows={3} maxRows={6} />
    </FormField>
  );
}
