"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";

import { bookings as initialBookings, guests as initialGuests, rooms as initialRooms } from "@/data";
import type { Booking, Guest, Room } from "@/data";
import { DataTable, FormSurface, MetricCard, StatusBadge } from "@/components/ui";
import { overlapsRange } from "@/lib/operations";

type GuestFormState = {
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  nationality: string;
  notes: string;
};

const TODAY = "2026-03-26";

function createGuestFormState(): GuestFormState {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    nationalId: "",
    nationality: "",
    notes: "",
  };
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(value: number): string {
  return `${value.toLocaleString("en-US")} Birr`;
}

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function bookingStatusBadge(status: Booking["status"]): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function bookingStatusLabel(status: Booking["status"]): string {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Cancelled";
}

function generateGuestId(index: number): string {
  return `guest-local-${String(index).padStart(3, "0")}`;
}

function generateBookingCode(index: number): string {
  return `BG-2026-LOCAL-${String(index).padStart(3, "0")}`;
}

function isBookingActive(booking: Booking): boolean {
  return booking.status === "confirmed" && booking.checkInDate <= TODAY && booking.checkOutDate > TODAY;
}

export function GuestsManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string>(initialGuests[0]?.id ?? "");

  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [guestForm, setGuestForm] = useState<GuestFormState>(createGuestFormState());
  const [guestFormError, setGuestFormError] = useState<string | null>(null);

  const [roomSelection, setRoomSelection] = useState<string>("");
  const [checkInNights, setCheckInNights] = useState<string>("2");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const selectedGuest = useMemo(
    () => guests.find((guest) => guest.id === selectedGuestId) ?? null,
    [guests, selectedGuestId],
  );

  const filteredGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return guests;
    }

    return guests.filter((guest) => {
      const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        guest.phone.toLowerCase().includes(query) ||
        (guest.nationalId ?? "").toLowerCase().includes(query)
      );
    });
  }, [guests, searchQuery]);

  const selectedGuestStayHistory = useMemo(() => {
    if (!selectedGuest) {
      return [];
    }

    return bookings
      .filter((booking) => booking.guestId === selectedGuest.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }, [bookings, selectedGuest]);

  const selectedGuestCurrentRoom = useMemo(() => {
    if (!selectedGuest) {
      return null;
    }

    return rooms.find((room) => room.currentGuestId === selectedGuest.id) ?? null;
  }, [rooms, selectedGuest]);

  const availableRooms = useMemo(
    () => rooms.filter((room) => room.status === "available" && !room.currentGuestId),
    [rooms],
  );

  const metrics = useMemo(() => {
    const activeGuests = rooms.filter((room) => room.status === "occupied" && room.currentGuestId).length;
    const checkInsToday = bookings.filter(
      (booking) => booking.status === "confirmed" && booking.checkInDate === TODAY,
    ).length;
    const checkOutsToday = bookings.filter(
      (booking) => booking.status === "confirmed" && booking.checkOutDate === TODAY,
    ).length;

    return {
      totalGuests: guests.length,
      activeGuests,
      checkInsToday,
      checkOutsToday,
    };
  }, [bookings, guests.length, rooms]);

  const openAddGuest = () => {
    setGuestForm(createGuestFormState());
    setGuestFormError(null);
    setIsAddGuestOpen(true);
  };

  const closeAddGuest = () => {
    setIsAddGuestOpen(false);
    setGuestFormError(null);
  };

  const handleAddGuest = () => {
    if (!guestForm.firstName.trim() || !guestForm.lastName.trim()) {
      setGuestFormError("First name and last name are required.");
      return;
    }

    if (!guestForm.phone.trim() || !guestForm.nationalId.trim()) {
      setGuestFormError("Phone number and ID are required.");
      return;
    }

    const duplicateId = guests.find(
      (guest) => (guest.nationalId ?? "").trim().toLowerCase() === guestForm.nationalId.trim().toLowerCase(),
    );

    if (duplicateId) {
      setGuestFormError("A guest with this ID already exists.");
      return;
    }

    const newGuest: Guest = {
      id: generateGuestId(guests.length + 1),
      firstName: guestForm.firstName.trim(),
      lastName: guestForm.lastName.trim(),
      name: `${guestForm.firstName.trim()} ${guestForm.lastName.trim()}`,
      phone: guestForm.phone.trim(),
      nationalId: guestForm.nationalId.trim(),
      nationality: guestForm.nationality.trim() || "Not specified",
      notes: guestForm.notes.trim() || undefined,
    };

    setGuests((currentGuests) => [newGuest, ...currentGuests]);
    setSelectedGuestId(newGuest.id);
    setIsAddGuestOpen(false);
    setActionMessage(`Guest ${newGuest.firstName} ${newGuest.lastName} added successfully.`);
  };

  const handleAssignRoom = () => {
    if (!selectedGuest) {
      return;
    }

    if (!roomSelection) {
      setActionMessage("Select an available room first.");
      return;
    }

    setRooms((currentRooms) =>
      currentRooms.map((room) => {
        if (room.id !== roomSelection) {
          return room;
        }

        return {
          ...room,
          currentGuestId: selectedGuest.id,
          status: "occupied",
        };
      }),
    );

    setActionMessage(`Room assigned to ${selectedGuest.firstName} ${selectedGuest.lastName}.`);
  };

  const handleCheckIn = () => {
    if (!selectedGuest) {
      return;
    }

    if (!roomSelection) {
      setActionMessage("Select an available room before check-in.");
      return;
    }

    const room = rooms.find((item) => item.id === roomSelection);
    const nights = Number(checkInNights);
    const checkInDate = TODAY;
    const checkOutDate = addDays(TODAY, nights);

    if (!room || !Number.isInteger(nights) || nights <= 0) {
      setActionMessage("Enter valid check-in details.");
      return;
    }

    if (checkOutDate <= checkInDate) {
      setActionMessage("Check-out date must be after check-in date.");
      return;
    }

    const overlappingRoomBooking = bookings.find(
      (booking) =>
        booking.roomId === room.id &&
        booking.status !== "cancelled" &&
        overlapsRange(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate),
    );

    if (overlappingRoomBooking) {
      setActionMessage("This room is already booked for the selected dates.");
      return;
    }

    const hasActiveStay = bookings.some((booking) => booking.guestId === selectedGuest.id && isBookingActive(booking));

    if (hasActiveStay) {
      setActionMessage("This guest already has an active booking.");
      return;
    }

    setRooms((currentRooms) =>
      currentRooms.map((item) => {
        if (item.id !== roomSelection) {
          return item;
        }

        return {
          ...item,
          currentGuestId: selectedGuest.id,
          status: "occupied",
        };
      }),
    );

    const bookingIndex = bookings.length + 1;

    const newBooking: Booking = {
      id: `book-local-${bookingIndex}`,
      code: generateBookingCode(bookingIndex),
      guest: {
        id: selectedGuest.id,
        name: `${selectedGuest.firstName} ${selectedGuest.lastName}`,
        phone: selectedGuest.phone,
      },
      guestId: selectedGuest.id,
      roomId: room.id,
      status: "confirmed",
      checkIn: checkInDate,
      checkOut: checkOutDate,
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      nights,
      totalAmount: room.price * nights,
      paidAmount: 0,
      remainingAmount: room.price * nights,
      paymentStatus: "unpaid",
      dueDate: TODAY,
      createdAt: `${TODAY}T12:00:00Z`,
      source: "walk-in",
    };

    setBookings((currentBookings) => [newBooking, ...currentBookings]);
    setActionMessage(`Check-in completed for ${selectedGuest.firstName} in room ${room.number}.`);
  };

  const handleCheckOut = () => {
    if (!selectedGuest || !selectedGuestCurrentRoom) {
      setActionMessage("Selected guest has no active room to check out.");
      return;
    }

    const activeBooking = bookings.find(
      (booking) =>
        booking.guestId === selectedGuest.id &&
        booking.roomId === selectedGuestCurrentRoom.id &&
        isBookingActive(booking),
    );

    if (activeBooking?.remainingAmount && activeBooking.remainingAmount > 0) {
      const shouldProceed = window.confirm(
        `Unpaid balance: ${formatMoney(activeBooking.remainingAmount)}. Continue checkout?`,
      );

      if (!shouldProceed) {
        return;
      }
    }

    setRooms((currentRooms) =>
      currentRooms.map((room) => {
        if (room.id !== selectedGuestCurrentRoom.id) {
          return room;
        }

        return {
          ...room,
          currentGuestId: undefined,
          status: "cleaning",
        };
      }),
    );

    setBookings((currentBookings) =>
      currentBookings.map((booking) => {
        if (
          booking.guestId === selectedGuest.id &&
          booking.roomId === selectedGuestCurrentRoom.id &&
          isBookingActive(booking)
        ) {
          return {
            ...booking,
            checkOut: TODAY,
            checkOutDate: TODAY,
            nights: Math.max(1, booking.nights),
          };
        }

        return booking;
      }),
    );

    setActionMessage(`Checked out ${selectedGuest.firstName}. Room moved to cleaning.`);
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Guest Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search guests, review profiles, and handle check-in/check-out operations.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddGuest}
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Guest
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Guests" value={String(metrics.totalGuests)} />
        <MetricCard title="Current Stays" value={String(metrics.activeGuests)} />
        <MetricCard title="Check-ins Today" value={String(metrics.checkInsToday)} />
        <MetricCard title="Check-outs Today" value={String(metrics.checkOutsToday)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label htmlFor="guest-search" className="text-sm font-medium text-slate-700">
              Search guests
            </label>
            <input
              id="guest-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Name, phone, or ID"
              className="h-10 w-full max-w-sm rounded-md border border-slate-200 px-3 text-sm text-slate-700"
            />
          </div>

          <DataTable<Guest>
            columns={[
              {
                key: "name",
                header: "Guest",
                render: (guest) => (
                  <div>
                    <p className="font-medium text-slate-900">
                      {guest.firstName} {guest.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{guest.nationality}</p>
                  </div>
                ),
              },
              {
                key: "phone",
                header: "Phone",
                render: (guest) => guest.phone,
              },
              {
                key: "id",
                header: "ID",
                render: (guest) => guest.nationalId,
              },
              {
                key: "room",
                header: "Current Room",
                render: (guest) => {
                  const room = rooms.find((item) => item.currentGuestId === guest.id);
                  return room ? `Room ${room.number}` : "Not assigned";
                },
              },
              {
                key: "profile",
                header: "Profile",
                align: "right",
                render: (guest) => (
                  <button
                    type="button"
                    onClick={() => setSelectedGuestId(guest.id)}
                    className="h-9 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    View
                  </button>
                ),
              },
            ]}
            data={filteredGuests}
            getRowKey={(guest) => guest.id}
            isLoading={isLoading}
            emptyTitle="No guests found"
            emptyDescription="Try another search term or add a new guest."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selectedGuest ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No guest selected</p>
              <p className="mt-1 text-sm text-slate-500">Select a guest to view profile and actions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {selectedGuest.firstName} {selectedGuest.lastName}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{selectedGuest.phone}</p>
                <p className="text-sm text-slate-600">{selectedGuest.nationalId}</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Assignment</p>
                {selectedGuestCurrentRoom ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-900">Room {selectedGuestCurrentRoom.number}</p>
                    <StatusBadge status={selectedGuestCurrentRoom.status} />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No room assigned</p>
                )}
              </div>

              <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-900">Actions</p>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Room selection</span>
                  <select
                    value={roomSelection}
                    onChange={(event) => setRoomSelection(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
                  >
                    <option value="">Select available room</option>
                    {availableRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        Room {room.number} ({room.type})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleAssignRoom}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Assign Room
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Check-out
                  </button>
                </div>

                <label className="space-y-1">
                  <span className="text-xs font-medium text-slate-600">Check-in nights</span>
                  <input
                    type="number"
                    min={1}
                    value={checkInNights}
                    onChange={(event) => setCheckInNights(event.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-700"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="h-10 w-full rounded-md bg-slate-900 px-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Check-in
                </button>

                {actionMessage ? (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    {actionMessage}
                  </p>
                ) : null}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">Stay History</p>
                {selectedGuestStayHistory.length === 0 ? (
                  <div className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                    No stay history yet.
                  </div>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {selectedGuestStayHistory.map((booking) => {
                      const room = rooms.find((item) => item.id === booking.roomId);

                      return (
                        <li key={booking.id} className="rounded-lg border border-slate-200 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-900">{booking.code}</p>
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${bookingStatusBadge(booking.status)}`}
                            >
                              {bookingStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600">
                            Room {room?.number ?? "N/A"} | {formatDate(booking.checkInDate)} -{" "}
                            {formatDate(booking.checkOutDate)}
                          </p>
                          <p className="mt-1 text-xs font-medium text-slate-700">
                            {formatMoney(booking.totalAmount)}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <FormSurface
        open={isAddGuestOpen}
        onClose={closeAddGuest}
        mode="drawer"
        title="Add New Guest"
        description="Capture profile details to register a guest."
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAddGuest}
              className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddGuest}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Save Guest
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">First Name</span>
              <input
                type="text"
                value={guestForm.firstName}
                onChange={(event) => setGuestForm((prev) => ({ ...prev, firstName: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Last Name</span>
              <input
                type="text"
                value={guestForm.lastName}
                onChange={(event) => setGuestForm((prev) => ({ ...prev, lastName: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>
          </div>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              type="text"
              value={guestForm.phone}
              onChange={(event) => setGuestForm((prev) => ({ ...prev, phone: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">National ID</span>
            <input
              type="text"
              value={guestForm.nationalId}
              onChange={(event) => setGuestForm((prev) => ({ ...prev, nationalId: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Nationality</span>
            <input
              type="text"
              value={guestForm.nationality}
              onChange={(event) => setGuestForm((prev) => ({ ...prev, nationality: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea
              value={guestForm.notes}
              onChange={(event) => setGuestForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={3}
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
            />
          </label>

          {guestFormError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {guestFormError}
            </p>
          ) : null}
        </div>
      </FormSurface>
    </div>
  );
}
