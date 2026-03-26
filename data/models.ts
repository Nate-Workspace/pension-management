import type { RoomStatus } from "@/lib/types/status";

export type RoomType = "single" | "double" | "vip";

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  nationality: string;
  notes?: string;
};

export type Room = {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  pricePerNight: number;
  capacity: number;
  currentGuestId?: Guest["id"];
};

export type BookingStatus = "confirmed" | "pending" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  guestId: Guest["id"];
  roomId: Room["id"];
  status: BookingStatus;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  createdAt: string;
  source: "walk-in" | "phone" | "website" | "agent";
};

export type PaymentMethod = "cash" | "mobile_money";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export type Payment = {
  id: string;
  bookingId: Booking["id"];
  guestId: Guest["id"];
  roomId: Room["id"];
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt?: string;
  reference: string;
};

export type StaffRole = "receptionist" | "cleaner";
export type StaffTaskStatus = "todo" | "in_progress" | "done";

export type StaffTask = {
  id: string;
  title: string;
  roomId?: Room["id"];
  dueAt: string;
  status: StaffTaskStatus;
};

export type StaffMember = {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  shift: "morning" | "afternoon" | "night";
  active: boolean;
  assignedRoomIds: Room["id"][];
  tasks: StaffTask[];
};
