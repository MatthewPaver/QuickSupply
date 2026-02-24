import { db } from "@/lib/db";
import { agents, agentTeacherAssignments, teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default async function AgencyAgentsPage() {
  await requireSession("agent");

  const allAgents = db.select().from(agents).all();
  const assignments = db
    .select({
      agentId: agentTeacherAssignments.agentId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
      teacherId: teachers.id,
    })
    .from(agentTeacherAssignments)
    .innerJoin(teachers, eq(agentTeacherAssignments.teacherId, teachers.id))
    .all();

  const agentTeachers = new Map<string, typeof assignments>();
  assignments.forEach((a) => {
    const list = agentTeachers.get(a.agentId) || [];
    list.push(a);
    agentTeachers.set(a.agentId, list);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agents</h1>
        <p className="text-muted-foreground">{allAgents.length} agency staff</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allAgents.map((agent) => {
          const teacherList = agentTeachers.get(agent.id) || [];
          return (
            <Card key={agent.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                  {agent.isAdmin && <Badge>Admin</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{agent.email}</div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{teacherList.length} teachers assigned</span>
                </div>
                <div className="space-y-1">
                  {teacherList.map((t) => (
                    <div key={t.teacherId} className="text-sm rounded bg-muted/50 px-2 py-1">
                      {t.teacherFirstName} {t.teacherLastName}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
