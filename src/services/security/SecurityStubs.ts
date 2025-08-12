export const Encryption = {
  async encrypt(data: string): Promise<string> {
    return data; // TODO: implement in Phase 2
  },
  async decrypt(data: string): Promise<string> {
    return data; // TODO: implement in Phase 2
  }
};

export const Biometrics = {
  async verify(): Promise<boolean> {
    return true; // TODO: integrate expo-local-authentication
  }
};


