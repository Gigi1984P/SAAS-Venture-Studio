"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Clock, AlertCircle, User } from "lucide-react";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => {
        const taskList = Array.isArray(data) ? data : data.tasks || [];
        setTasks(taskList);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED": return <CheckSquare className="w-5 h-5 text-green-500" />;
      case "PENDING": return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "PENDING": return "bg-yellow-100 text-yellow-700";
      case "RUNNING": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) return <div className="p-8">Lade Tasks...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Tasks</h1>
      <p className="text-muted-foreground mb-8">Aufgaben und Agenten-Runs</p>

      <div className="space-y-3">
        {tasks.map((task: any) => (
          <div key={task.id} className="border rounded-lg p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
            {getStatusIcon(task.status)}
            <div className="flex-1">
              <h3 className="font-medium">{task.title}</h3>
              <p className="text-sm text-muted-foreground">{task.description || "Keine Beschreibung"}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
              {task.status || "UNKNOWN"}
            </span>
            <span className="text-xs text-muted-foreground">
              {task.priority || "medium"}
            </span>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 border rounded-lg">
          <CheckSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Tasks vorhanden.</p>
          <p className="text-sm text-muted-foreground mt-2">Der Orchestrator erstellt Tasks automatisch.</p>
        </div>
      )}
    </div>
  );
}
