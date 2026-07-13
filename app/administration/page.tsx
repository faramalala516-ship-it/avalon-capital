import { UserCog } from "lucide-react";
import { PageShell } from "@/components/page-shell";

const admin = ["Gestion utilisateurs", "Gestion abonnements", "Publication rapports", "Gestion articles", "Gestion pierres", "Statistiques", "Logs"];

export default function AdminPage() {
  return (
    <PageShell title="Administration" eyebrow="Back office" description="Pilotage des utilisateurs, abonnements, contenus, pierres, statistiques et logs." icon={UserCog}>
      <div className="grid gap-4 md:grid-cols-3">
        {admin.map((item) => <div key={item} className="glass rounded-lg p-5 font-semibold text-white">{item}</div>)}
      </div>
    </PageShell>
  );
}
