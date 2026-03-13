import { create } from 'zustand';

export type BookingDraft = {
  doctorId: string;
  date: string;
  slotId: string;
  slotLabel: string;
  period: 'morning' | 'afternoon';
  chiefComplaint?: string;
  symptoms?: string;
  patientNotes?: string;
  finalConsultationFee?: number;
};

type BookingStore = {
  draft: BookingDraft | null;
  setDraft: (draft: BookingDraft) => void;
  clearDraft: () => void;
};

export const useBookingStore = create<BookingStore>((set) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  clearDraft: () => set({ draft: null }),
}));
