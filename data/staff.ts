import type { StaffMember } from "./models";

export const staff: StaffMember[] = [
  {
    id: "staff-001",
    name: "Mariama Ba",
    phone: "+221 78 110 5542",
    role: "receptionist",
    shift: "morning",
    active: true,
    assignedRoomIds: ["room-101", "room-102", "room-201"],
    tasks: [
      {
        id: "task-001",
        title: "Confirm tomorrow check-ins",
        dueAt: "2026-03-27T18:00:00Z",
        status: "in_progress",
      },
      {
        id: "task-002",
        title: "Call pending booking BG-2026-0325",
        dueAt: "2026-03-26T16:30:00Z",
        status: "todo",
      },
    ],
  },
  {
    id: "staff-002",
    name: "Ibrahima Fall",
    phone: "+221 77 553 6620",
    role: "receptionist",
    shift: "night",
    active: true,
    assignedRoomIds: ["room-202", "room-301", "room-302"],
    tasks: [
      {
        id: "task-003",
        title: "Prepare late arrival file for Leila Boukari",
        roomId: "room-302",
        dueAt: "2026-03-28T20:00:00Z",
        status: "todo",
      },
    ],
  },
  {
    id: "staff-003",
    name: "Awa Thiam",
    phone: "+221 76 334 0988",
    role: "cleaner",
    shift: "afternoon",
    active: true,
    assignedRoomIds: ["room-103", "room-203"],
    tasks: [
      {
        id: "task-004",
        title: "Deep clean room 103",
        roomId: "room-103",
        dueAt: "2026-03-26T15:00:00Z",
        status: "in_progress",
      },
      {
        id: "task-005",
        title: "Inspect maintenance prep for room 203",
        roomId: "room-203",
        dueAt: "2026-03-26T17:00:00Z",
        status: "todo",
      },
    ],
  },
  {
    id: "staff-004",
    name: "Jean Kouame",
    phone: "+225 05 03 11 87 30",
    role: "cleaner",
    shift: "morning",
    active: false,
    assignedRoomIds: ["room-201"],
    tasks: [
      {
        id: "task-006",
        title: "Laundry pickup and sorting",
        dueAt: "2026-03-25T09:00:00Z",
        status: "done",
      },
    ],
  },
];
