import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { StudentBottomNav } from "@/components/student/BottomNav";
import { StudentFabs } from "@/components/student/Fabs";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/student")({
  component: StudentLayout,
});

function StudentLayout() {
  const { isStudent, isStaff, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isStudent && isStaff) navigate({ to: "/admin" });
  }, [loading, isStudent, isStaff, navigate]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <StudentFabs />
      <StudentBottomNav />
    </div>
  );
}
