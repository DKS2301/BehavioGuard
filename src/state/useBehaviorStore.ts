import { create } from 'zustand';

type BehaviorState = {
  features: number[]; // length 100
  isCollecting: boolean;
  setFeatures: (features: number[]) => void;
  setCollecting: (isCollecting: boolean) => void;
};

export const useBehaviorStore = create<BehaviorState>((set) => ({
  features: Array.from({ length: 100 }, () => 0),
  isCollecting: false,
  setFeatures: (features) => set({ features }),
  setCollecting: (isCollecting) => set({ isCollecting })
}));


