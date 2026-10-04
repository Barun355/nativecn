import { Inbox, Plus } from "lucide-react-native";

import { Button } from "@/registry/components/button";
import { EmptyState } from "@/registry/components/empty-state";

/** An empty inbox with an action. */
export default function EmptyStateDemo() {
  return (
    <EmptyState
      icon={Inbox}
      title="No messages yet"
      description="When someone writes to you, their message will appear here."
    >
      <Button label="New message" icon={Plus} />
    </EmptyState>
  );
}
