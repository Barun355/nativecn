import { useState } from "react";

import { SearchField } from "@/registry/components/search-field";

export function SearchFieldDemo() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <SearchField
      value={query}
      onChangeText={setQuery}
      placeholder="Search recipes"
      loading={loading}
      onSubmit={() => {
        setLoading(true);
        setTimeout(() => setLoading(false), 800);
      }}
    />
  );
}
