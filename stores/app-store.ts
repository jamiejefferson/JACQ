import { create } from "zustand";

export interface ChatContext {
  screen: string;
  section?: string;
  itemId?: string;
  itemLabel?: string;
  prefill?: string;
}

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; saved?: { label: string; section?: string }[]; toolErrorReasons?: string[] };

interface AppState {
  user: { id: string; email?: string; name?: string } | null;
  darkMode: boolean;
  activeChatContext: ChatContext | null;
  isChatPanelOpen: boolean;
  isBurgerOpen: boolean;
  chatHistory: ChatMessage[];
  chatSessionId: string | null;
  setUser: (user: AppState["user"]) => void;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  openChat: (context: ChatContext | null) => void;
  closeChat: () => void;
  setChatHistory: (history: ChatMessage[]) => void;
  setChatSessionId: (id: string | null) => void;
  appendChatMessage: (msg: ChatMessage) => void;
  setBurgerOpen: (open: boolean) => void;
  toggleBurger: () => void;
  toast: string | null;
  setToast: (msg: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  darkMode: false,
  activeChatContext: null,
  isChatPanelOpen: false,
  isBurgerOpen: false,
  chatHistory: [],
  chatSessionId: null,
  setUser: (user) => set({ user }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setDarkMode: (value) => set({ darkMode: value }),
  openChat: (context) => set({ activeChatContext: context, isChatPanelOpen: true, chatHistory: [] }),
  closeChat: () => set({ isChatPanelOpen: false, activeChatContext: null, chatHistory: [], chatSessionId: null }),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setChatSessionId: (chatSessionId) => set({ chatSessionId }),
  appendChatMessage: (msg) => set((s) => ({ chatHistory: [...s.chatHistory, msg] })),
  setBurgerOpen: (open) => set({ isBurgerOpen: open }),
  toggleBurger: () => set((s) => ({ isBurgerOpen: !s.isBurgerOpen })),
  toast: null,
  setToast: (toast) => set({ toast }),
}));
