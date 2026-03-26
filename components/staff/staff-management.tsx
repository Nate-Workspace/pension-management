"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";

import { rooms, staff as initialStaff } from "@/data";
import type { Room, StaffMember, StaffRole, StaffTaskStatus } from "@/data";
import { DataTable, FormSurface, MetricCard } from "@/components/ui";

type RoleFilter = "all" | StaffRole;

type TaskFormState = {
  staffId: string;
  title: string;
  roomId: string;
  dueAt: string;
  status: StaffTaskStatus;
};

function roleLabel(role: StaffRole): string {
  return role === "cleaner" ? "Cleaner" : "Receptionist";
}

function roleStyle(role: StaffRole): string {
  return role === "cleaner"
    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
    : "border-indigo-200 bg-indigo-50 text-indigo-700";
}

function shiftLabel(shift: StaffMember["shift"]): string {
  return `${shift.slice(0, 1).toUpperCase()}${shift.slice(1)}`;
}

function taskStatusLabel(status: StaffTaskStatus): string {
  if (status === "in_progress") {
    return "In Progress";
  }

  if (status === "done") {
    return "Done";
  }

  return "To Do";
}

function taskStatusStyle(status: StaffTaskStatus): string {
  if (status === "in_progress") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function toRoomLabel(roomId?: string): string {
  if (!roomId) {
    return "General";
  }

  const room = rooms.find((item) => item.id === roomId);
  return room ? `Room ${room.number}` : "Unknown room";
}

function toDateLabel(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function taskDefaults(staffId: string): TaskFormState {
  return {
    staffId,
    title: "",
    roomId: "",
    dueAt: "2026-03-27T10:00",
    status: "todo",
  };
}

export function StaffManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [selectedStaffId, setSelectedStaffId] = useState<string>(initialStaff[0]?.id ?? "");

  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskFormState>(taskDefaults(initialStaff[0]?.id ?? ""));
  const [taskError, setTaskError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 400);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredStaff = useMemo(() => {
    if (roleFilter === "all") {
      return staff;
    }

    return staff.filter((member) => member.role === roleFilter);
  }, [roleFilter, staff]);

  const selectedStaff = useMemo(
    () => staff.find((member) => member.id === selectedStaffId) ?? null,
    [selectedStaffId, staff],
  );

  const metrics = useMemo(() => {
    const activeCount = staff.filter((member) => member.active).length;
    const cleanerCount = staff.filter((member) => member.role === "cleaner").length;
    const receptionistCount = staff.filter((member) => member.role === "receptionist").length;
    const openTasks = staff.reduce(
      (sum, member) => sum + member.tasks.filter((task) => task.status !== "done").length,
      0,
    );

    return {
      total: staff.length,
      activeCount,
      cleanerCount,
      receptionistCount,
      openTasks,
    };
  }, [staff]);

  const openTaskDrawer = (staffId?: string) => {
    const targetStaffId = staffId ?? selectedStaffId;
    setTaskForm(taskDefaults(targetStaffId));
    setTaskError(null);
    setIsTaskDrawerOpen(true);
  };

  const closeTaskDrawer = () => {
    setIsTaskDrawerOpen(false);
    setTaskError(null);
  };

  const assignTask = () => {
    if (!taskForm.staffId) {
      setTaskError("Please select a staff member.");
      return;
    }

    if (!taskForm.title.trim()) {
      setTaskError("Task title is required.");
      return;
    }

    if (!taskForm.dueAt) {
      setTaskError("Please set a due date and time.");
      return;
    }

    setStaff((currentStaff) =>
      currentStaff.map((member) => {
        if (member.id !== taskForm.staffId) {
          return member;
        }

        return {
          ...member,
          tasks: [
            {
              id: `task-local-${member.tasks.length + 1}-${Date.now()}`,
              title: taskForm.title.trim(),
              roomId: taskForm.roomId || undefined,
              dueAt: new Date(taskForm.dueAt).toISOString(),
              status: taskForm.status,
            },
            ...member.tasks,
          ],
        };
      }),
    );

    setIsTaskDrawerOpen(false);
    setTaskError(null);
  };

  const updateTaskStatus = (staffId: string, taskId: string, status: StaffTaskStatus) => {
    setStaff((currentStaff) =>
      currentStaff.map((member) => {
        if (member.id !== staffId) {
          return member;
        }

        return {
          ...member,
          tasks: member.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Staff Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage reception and cleaning teams, and assign operational tasks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openTaskDrawer()}
          className="inline-flex h-10 items-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Assign Task
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Staff" value={String(metrics.total)} />
        <MetricCard title="Active" value={String(metrics.activeCount)} />
        <MetricCard title="Receptionists" value={String(metrics.receptionistCount)} />
        <MetricCard title="Cleaners" value={String(metrics.cleanerCount)} />
        <MetricCard title="Open Tasks" value={String(metrics.openTasks)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label htmlFor="role-filter" className="text-sm font-medium text-slate-700">
              Filter by role
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
            >
              <option value="all">All roles</option>
              <option value="receptionist">Receptionist</option>
              <option value="cleaner">Cleaner</option>
            </select>
          </div>

          <DataTable<StaffMember>
            columns={[
              {
                key: "name",
                header: "Staff",
                render: (member) => (
                  <div>
                    <p className="font-medium text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.phone}</p>
                  </div>
                ),
              },
              {
                key: "role",
                header: "Role",
                render: (member) => (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStyle(member.role)}`}
                  >
                    {roleLabel(member.role)}
                  </span>
                ),
              },
              {
                key: "shift",
                header: "Shift",
                align: "center",
                render: (member) => shiftLabel(member.shift),
              },
              {
                key: "tasks",
                header: "Tasks",
                align: "center",
                render: (member) => String(member.tasks.length),
              },
              {
                key: "status",
                header: "Status",
                render: (member) => (
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      member.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-100 text-slate-600"
                    }`}
                  >
                    {member.active ? "Active" : "Inactive"}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (member) => (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffId(member.id)}
                      className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      View Tasks
                    </button>
                    <button
                      type="button"
                      onClick={() => openTaskDrawer(member.id)}
                      className="h-8 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Assign
                    </button>
                  </div>
                ),
              },
            ]}
            data={filteredStaff}
            getRowKey={(member) => member.id}
            isLoading={isLoading}
            emptyTitle="No staff found"
            emptyDescription="Try another role filter."
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {!selectedStaff ? (
            <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              Select a staff member to view tasks.
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{selectedStaff.name}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {roleLabel(selectedStaff.role)} • {shiftLabel(selectedStaff.shift)} shift
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">Assigned Rooms</p>
                {selectedStaff.assignedRoomIds.length === 0 ? (
                  <p className="mt-1 text-sm text-slate-500">No assigned rooms.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedStaff.assignedRoomIds.map((roomId) => (
                      <span
                        key={roomId}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {toRoomLabel(roomId)}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">Task Assignment</p>
                {selectedStaff.tasks.length === 0 ? (
                  <div className="mt-2 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500">
                    No tasks assigned.
                  </div>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {selectedStaff.tasks.map((task) => (
                      <li key={task.id} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{task.title}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {toRoomLabel(task.roomId)} • due {toDateLabel(task.dueAt)}
                            </p>
                          </div>

                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-semibold ${taskStatusStyle(task.status)}`}
                          >
                            {taskStatusLabel(task.status)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <select
                            value={task.status}
                            onChange={(event) =>
                              updateTaskStatus(
                                selectedStaff.id,
                                task.id,
                                event.target.value as StaffTaskStatus,
                              )
                            }
                            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-700"
                          >
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <FormSurface
        open={isTaskDrawerOpen}
        onClose={closeTaskDrawer}
        mode="drawer"
        title="Assign Staff Task"
        description="Create and assign operational tasks to cleaners or receptionists."
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeTaskDrawer}
              className="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={assignTask}
              className="h-10 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
            >
              Assign Task
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Staff Member</span>
            <select
              value={taskForm.staffId}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, staffId: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({roleLabel(member.role)})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Task Title</span>
            <input
              type="text"
              value={taskForm.title}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              placeholder="e.g. Clean room 201 before check-in"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Room (optional)</span>
            <select
              value={taskForm.roomId}
              onChange={(event) => setTaskForm((prev) => ({ ...prev, roomId: event.target.value }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
            >
              <option value="">General task</option>
              {rooms.map((room: Room) => (
                <option key={room.id} value={room.id}>
                  Room {room.number}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Due Date & Time</span>
              <input
                type="datetime-local"
                value={taskForm.dueAt}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, dueAt: event.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Initial Status</span>
              <select
                value={taskForm.status}
                onChange={(event) =>
                  setTaskForm((prev) => ({ ...prev, status: event.target.value as StaffTaskStatus }))
                }
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>

          {taskError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {taskError}
            </p>
          ) : null}
        </div>
      </FormSurface>
    </div>
  );
}
