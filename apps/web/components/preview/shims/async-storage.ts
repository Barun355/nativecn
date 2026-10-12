// Web stand-in for AsyncStorage in the preview: nothing is persisted, so a preview never carries
// a Scheme or Preset over from an earlier visit (the builder's URL is the only state).
const memory = new Map<string, string>();

const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return memory.get(key) ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    memory.set(key, value);
  },
  async removeItem(key: string): Promise<void> {
    memory.delete(key);
  },
};

export default AsyncStorage;
