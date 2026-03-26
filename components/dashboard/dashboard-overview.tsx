"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { bookings, guests, payments, rooms } from "@/data";
import type { BookingStatus, Room } from "@/data";
import { ChartWrapper, DataTable, MetricCard, StatusBadge } from "@/components/ui";

type OccupancyPoint = {
  label: string;
  occupancyRate: number;
};

type RevenuePoint = {
  label: string;
  revenue: number;
};

type RecentBookingRow = {
  id: string;
  bookingCode: string;
  guestName: string;
  roomNumber: string;
  status: BookingStatus;
  totalAmount: number;
  checkInDate: string;
};

type CheckInItem = {
  id: string;
  guestName: string;
  roomNumber: string;
  roomStatus: Room["status"];
  checkInDate: string;
  checkOutDate: string;
};

const OPERATION_DATE = "2026-03-26";

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("en-US")} Birr`;
}

function toNumber(value: number | string | readonly (number | string)[] | undefined): number {
  if (Array.isArray(value)) {
    return toNumber(value[0]);
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function dateLabel(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function addDays(baseDate: string, days: number): string {
  const date = new Date(`${baseDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function statusStyles(status: BookingStatus): string {
  if (status === "confirmed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function statusLabel(status: BookingStatus): string {
  if (status === "confirmed") {
    return "Confirmed";
  }

  if (status === "pending") {
    return "Pending";
  }

  return "Cancelled";
}

function isDateInsideStay(day: string, checkInDate: string, checkOutDate: string): boolean {
  return day >= checkInDate && day < checkOutDate;
}

export function DashboardOverview() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false);
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const roomById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), []);
  const guestById = useMemo(() => new Map(guests.map((guest) => [guest.id, guest])), []);

  const metrics = useMemo(() => {
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
    const availableRooms = rooms.filter((room) => room.status === "available").length;

    const checkInsToday = bookings.filter(
      (booking) => booking.status === "confirmed" && booking.checkInDate === OPERATION_DATE,
    ).length;

    const monthlyRevenue = payments
      .filter((payment) => payment.paidAt?.startsWith("2026-03"))
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      totalRooms,
      occupiedRooms,
      availableRooms,
      checkInsToday,
      monthlyRevenue,
      occupancyRate: Math.round((occupiedRooms / totalRooms) * 100),
    };
  }, []);

  const occupancySeries = useMemo<OccupancyPoint[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(OPERATION_DATE, index - 6);
      const occupiedCount = bookings.filter(
        (booking) => booking.status === "confirmed" && isDateInsideStay(day, booking.checkInDate, booking.checkOutDate),
      ).length;

      return {
        label: dateLabel(day),
        occupancyRate: Math.round((occupiedCount / rooms.length) * 100),
      };
    });
  }, []);

  const revenueSeries = useMemo<RevenuePoint[]>(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = addDays(OPERATION_DATE, index - 6);
      const revenue = payments
        .filter((payment) => payment.paidAt?.slice(0, 10) === day)
        .reduce((sum, payment) => sum + payment.amount, 0);

      return {
        label: dateLabel(day),
        revenue,
      };
    });
  }, []);

  const recentBookingRows = useMemo<RecentBookingRow[]>(() => {
    return [...bookings]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5)
      .map((booking) => {
        const guest = guestById.get(booking.guestId);
        const room = roomById.get(booking.roomId);

        return {
          id: booking.id,
          bookingCode: booking.code,
          guestName: guest ? `${guest.firstName} ${guest.lastName}` : "Unknown guest",
          roomNumber: room ? room.number : "N/A",
          status: booking.status,
          totalAmount: booking.totalAmount,
          checkInDate: booking.checkInDate,
        };
      });
  }, [guestById, roomById]);

  const recentCheckIns = useMemo<CheckInItem[]>(() => {
    return bookings
      .filter((booking) => booking.status === "confirmed" && booking.checkInDate >= OPERATION_DATE)
      .sort((left, right) => left.checkInDate.localeCompare(right.checkInDate))
      .slice(0, 5)
      .map((booking) => {
        const guest = guestById.get(booking.guestId);
        const room = roomById.get(booking.roomId);

        return {
          id: booking.id,
          guestName: guest ? `${guest.firstName} ${guest.lastName}` : "Unknown guest",
          roomNumber: room?.number ?? "N/A",
          roomStatus: room?.status ?? "maintenance",
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
        };
      });
  }, [guestById, roomById]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Operations Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Real-time snapshot of room occupancy, check-ins, and revenue performance.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Total Rooms"
          value={isLoading ? "--" : String(metrics.totalRooms)}
          description="Inventory in system"
        />
        <MetricCard
          title="Occupied"
          value={isLoading ? "--" : String(metrics.occupiedRooms)}
          change={{ value: `${metrics.occupancyRate}%`, direction: "up", label: "occupancy rate" }}
        />
        <MetricCard
          title="Available"
          value={isLoading ? "--" : String(metrics.availableRooms)}
          description="Ready for new bookings"
        />
        <MetricCard
          title="Today Check-ins"
          value={isLoading ? "--" : String(metrics.checkInsToday)}
          description={`Operational date: ${dateLabel(OPERATION_DATE)}`}
        />
        <MetricCard
          title="Monthly Revenue"
          value={isLoading ? "--" : formatCurrency(metrics.monthlyRevenue)}
          description="Collected in March"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ChartWrapper
          title="Occupancy Rate"
          description="Last 7 operational days"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={occupancySeries}>
              <defs>
                <linearGradient id="occupancy-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0f766e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip formatter={(value) => `${toNumber(value)}%`} />
              <Area
                type="monotone"
                dataKey="occupancyRate"
                stroke="#0f766e"
                fill="url(#occupancy-fill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrapper>

        <ChartWrapper
          title="Revenue Trend"
          description="Collected payments for the last 7 days"
          isLoading={isLoading}
          minHeightClassName="min-h-[300px]"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueSeries}>
              <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#94a3b8"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <Tooltip formatter={(value) => formatCurrency(toNumber(value))} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#1d4ed8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#1d4ed8" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">Recent Bookings</h2>
            <p className="text-sm text-slate-500">Latest reservations and booking statuses.</p>
          </div>

          <DataTable<RecentBookingRow>
            columns={[
              {
                key: "booking",
                header: "Booking",
                render: (row) => (
                  <div>
                    <p className="font-medium text-slate-900">{row.bookingCode}</p>
                    <p className="text-xs text-slate-500">Check-in {dateLabel(row.checkInDate)}</p>
                  </div>
                ),
              },
              {
                key: "guest",
                header: "Guest",
                render: (row) => row.guestName,
              },
              {
                key: "room",
                header: "Room",
                align: "center",
                render: (row) => row.roomNumber,
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles(row.status)}`}
                  >
                    {statusLabel(row.status)}
                  </span>
                ),
              },
              {
                key: "amount",
                header: "Total",
                align: "right",
                render: (row) => formatCurrency(row.totalAmount),
              },
            ]}
            data={recentBookingRows}
            getRowKey={(row) => row.id}
            isLoading={isLoading}
            emptyTitle="No recent bookings"
            emptyDescription="Bookings will appear here as they are created."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-900">Upcoming Check-ins</h2>
            <p className="text-sm text-slate-500">Guests arriving from today onwards.</p>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={`checkin-loading-${index}`} className="rounded-lg border border-slate-200 p-3">
                  <div className="h-4 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : recentCheckIns.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">No upcoming check-ins</p>
              <p className="mt-1 text-sm text-slate-500">New arrivals will be listed here.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentCheckIns.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-slate-900">{item.guestName}</p>
                    <StatusBadge status={item.roomStatus} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Room {item.roomNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {dateLabel(item.checkInDate)} - {dateLabel(item.checkOutDate)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
