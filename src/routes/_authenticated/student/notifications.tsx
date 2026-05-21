import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/student/notifications")({
  component: () => (
    <div className="px-5 pt-8">
      <h1 className="mb-5 font-display text-2xl font-semibold">Notifications</h1>
      <Card className="border-border bg-card p-8 text-center">
        <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Aucune notification pour le moment.</p>
      </Card>
    </div>
  ),
});
