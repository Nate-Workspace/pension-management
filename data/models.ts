export type RoomType = "single" | "double" | "vip";
export type RoomStatus = "available" | "occupied" | "cleaning" | "maintenance";

export type Guest = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId?: string;
  nationality: string;
  notes?: string;
};

export type Room = {
  id: string;
  name: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  price: number;
  pricePerNight: number;
  capacity: number;
  currentGuestId?: Guest["id"];
};

export type BookingGuestInfo = {
  name: string;
  phone: string;
  id?: string;
};

export type BookingPaymentStatus = "paid" | "partial" | "unpaid";

export type BookingStatus = "confirmed" | "pending" | "cancelled";

export type Booking = {
  id: string;
  code: string;
  guest: BookingGuestInfo;
  guestId: Guest["id"];
  roomId: Room["id"];
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: BookingPaymentStatus;
  dueDate?: string;
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
