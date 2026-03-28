import { useState } from "react";
import {
  Plus,
  Check,
  Trash2,
  Edit2,
  Loader2,
  X,
  GripVertical,
  ChevronRight,
} from "lucide-react";
import { useTodos, useTodoMutations } from "@/hooks/useProjectDetails";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableTodoItem({
  todo,
  editingId,
  editName,
  setEditName,
  handleSaveEdit,
  setEditingId,
  handleEditTask,
  updateTodo,
  deleteTodo,
  isAdmin,
}: any) {
  const isEditing = editingId === todo.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id, disabled: !isAdmin || isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-3 rounded-xl p-3 border transition-all relative touch-none
        ${todo.is_completed ? "bg-slate-50/50 border-transparent hover:bg-slate-50" : "bg-white shadow-sm border-slate-200 hover:border-slate-300"}
        ${isDragging ? "shadow-xl border-blue-500 ring-1 ring-blue-500 scale-[1.02]" : ""}
      `}
    >
      {isEditing ? (
        <div className="flex w-full items-center gap-2">
          <input
            autoFocus
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(todo.id)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/10"
          />
          <button
            onClick={() => handleSaveEdit(todo.id)}
            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {isAdmin && (
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 -ml-1.5 rounded text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            <button
              disabled={!isAdmin}
              onClick={() =>
                updateTodo.mutate({
                  id: todo.id,
                  is_completed: !todo.is_completed,
                })
              }
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${
                todo.is_completed
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : `border-slate-300 bg-transparent ${isAdmin ? "hover:border-blue-500" : ""}`
              }`}
            >
              {todo.is_completed && (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              )}
            </button>
            <span
              className={`truncate text-[15px] font-medium transition-colors ${todo.is_completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"}`}
            >
              {todo.task_name}
            </span>
          </div>

          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleEditTask(todo.id, todo.task_name)}
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                title="Rename Task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteTodo.mutate(todo.id)}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TodoItemOverlay({ todo, isAdmin }: any) {
  if (!todo) return null;
  return (
    <div className="group flex items-center justify-between gap-3 rounded-xl p-3 border transition-all relative touch-none bg-white shadow-2xl border-blue-500 ring-1 ring-blue-500 scale-[1.02] cursor-grabbing rotate-1">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {isAdmin && (
          <div className="p-1 -ml-1.5 text-slate-500">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <button
          disabled
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${todo.is_completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-transparent"}`}
        >
          {todo.is_completed && (
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          )}
        </button>
        <span
          className={`truncate text-[15px] font-medium ${todo.is_completed ? "text-slate-400 line-through decoration-slate-300" : "text-slate-700"}`}
        >
          {todo.task_name}
        </span>
      </div>
    </div>
  );
}

function TaskList({
  todos,
  sensors,
  handleDragStart,
  handleDragEnd,
  handleDragCancel,
  activeId,
  editingId,
  editName,
  setEditName,
  setEditingId,
  handleSaveEdit,
  handleEditTask,
  updateTodo,
  deleteTodo,
  isAdmin,
  isLoading,
  isError,
}: any) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (isError) {
    return (
      <p className="text-sm font-medium text-red-400 text-center py-6">
        Failed to load tasks.
      </p>
    );
  }
  if (todos.length === 0) {
    return (
      <p className="text-sm font-medium text-slate-400 text-center py-6">
        No tasks yet.
      </p>
    );
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={todos.map((t: any) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {todos.map((todo: any) => (
          <SortableTodoItem
            key={todo.id}
            todo={todo}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            setEditingId={setEditingId}
            handleSaveEdit={handleSaveEdit}
            handleEditTask={handleEditTask}
            updateTodo={updateTodo}
            deleteTodo={deleteTodo}
            isAdmin={isAdmin}
          />
        ))}
      </SortableContext>
      <DragOverlay>
        {activeId ? (
          <TodoItemOverlay
            todo={todos.find((t: any) => t.id === activeId)}
            isAdmin={isAdmin}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function AddTaskModal({
  onSubmit,
  onClose,
  newTask,
  setNewTask,
  isPending,
}: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Add New Task</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <label className="block text-xs font-bold text-slate-500 mb-1.5">
            Task Description
          </label>
          <input
            required
            autoFocus
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:bg-white transition-colors"
            placeholder="e.g. Schedule opening ceremony"
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newTask.trim() || isPending}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgb(37,99,235,0.2)] hover:shadow-lg transition-all"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Task
          </button>
        </div>
      </form>
    </div>
  );
}

export function ToDoList({
  projectId,
  isFullScreen = false,
  projectName,
}: {
  projectId: string;
  isFullScreen?: boolean;
  projectName?: string;
}) {
  const { data: user } = useAuth();
  const isAdmin = !!user;

  const [newTask, setNewTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: todos = [], isLoading, isError } = useTodos(projectId);
  const { createTodo, updateTodo, deleteTodo, reorderTodos } =
    useTodoMutations(projectId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id as string);
  const handleDragCancel = () => setActiveId(null);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);
      const newArray = arrayMove(todos, oldIndex, newIndex);
      reorderTodos.mutate(
        newArray.map((t: any, idx: number) => ({ id: t.id, order_index: idx })),
      );
    }
  };

  const handleEditTask = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };
  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateTodo.mutate(
      { id, task_name: editName },
      { onSuccess: () => setEditingId(null) },
    );
  };
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    createTodo.mutate(newTask.trim(), {
      onSuccess: () => {
        setNewTask("");
        setIsAdding(false);
      },
    });
  };

  const completedCount = todos.filter((t) => t.is_completed).length;
  const totalCount = todos.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getProgressColorClass = (pct: number) => {
    if (pct < 30) return "stroke-red-500";
    if (pct < 70) return "stroke-amber-400";
    if (pct < 100) return "stroke-blue-600";
    return "stroke-emerald-500";
  };

  const sharedTaskListProps = {
    todos,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    activeId,
    editingId,
    editName,
    setEditName,
    setEditingId,
    handleSaveEdit,
    handleEditTask,
    updateTodo,
    deleteTodo,
    isAdmin,
    isLoading,
    isError,
  };

  // ---- Full-screen version (standalone todo page) ----
  if (isFullScreen) {
    return (
      <div className="flex flex-col w-full h-full flex-1 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {projectName ? `${projectName} Tasks` : "Tasks"}
            </h2>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              {completedCount} of {totalCount} tasks completed
            </p>
          </div>

          {/* Circular Progress */}
          <div className="flex items-center justify-center rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 shrink-0">
            <div className="relative h-24 w-24">
              <svg
                className="h-full w-full rotate-[120deg]"
                viewBox="0 0 36 36"
              >
                <path
                  className="stroke-slate-100"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-700 ${getProgressColorClass(completionPercentage)}`}
                  strokeWidth="3"
                  strokeDasharray={`${completionPercentage}, 100`}
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  {completionPercentage}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">
                  Done
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pb-20">
          <TaskList {...sharedTaskListProps} />
        </div>

        {/* Add Task Button */}
        <div className="absolute bottom-0 left-0 z-10 right-0 p-4 flex justify-center">
          {isAdmin && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full max-w-lg flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 rounded-xl font-bold shadow-sm transition-all text-sm mb-1"
            >
              <Plus className="h-4 w-4" /> Add Task
            </button>
          )}
        </div>

        {isAdding && isAdmin && (
          <AddTaskModal
            onSubmit={handleAddTask}
            onClose={() => setIsAdding(false)}
            newTask={newTask}
            setNewTask={setNewTask}
            isPending={createTodo.isPending}
          />
        )}
      </div>
    );
  }

  // ---- Compact card version (embedded in project details) ----
  return (
    <div className="flex flex-col rounded-2xl bg-slate-50 p-6 w-80 shrink-0 h-[500px] border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/todo/${projectId}`}
          className="flex items-center gap-2 group/link w-fit"
        >
          <h3 className="text-xl font-bold text-slate-900 group-hover/link:text-blue-600 transition-colors">
            To Do List
          </h3>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover/link:text-blue-600 group-hover/link:translate-x-1 transition-all" />
        </Link>
        {isAdmin && (
          <button className="text-slate-400 hover:text-blue-600 transition-colors">
            <Edit2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-[300px] pb-14">
        <TaskList {...sharedTaskListProps} />
      </div>

      <div className="absolute bottom-0 left-0 z-10 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent flex justify-center">
        {isAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            className="w-[90%] flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 text-slate-800 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 rounded-xl font-bold shadow-sm transition-all text-sm mb-1"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        )}
      </div>

      {isAdding && isAdmin && (
        <AddTaskModal
          onSubmit={handleAddTask}
          onClose={() => setIsAdding(false)}
          newTask={newTask}
          setNewTask={setNewTask}
          isPending={createTodo.isPending}
        />
      )}
    </div>
  );
}
