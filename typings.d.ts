interface Message {
  text: string;
  createdAt: admin.firestore.Timestamp;
  user: {
    _id: string | null | undefined;
    name: string | null | undefined;
    avatar: string;
  };
}

declare module "@openai/api" {
  export const setApiKey: (apiKey: string) => void;
  export const createCompletion: (parameters: any) => Promise<any>;
  export const createChatCompletion: (parameters: any) => Promise<any>;
  // Add any other functions you need to use here
}
