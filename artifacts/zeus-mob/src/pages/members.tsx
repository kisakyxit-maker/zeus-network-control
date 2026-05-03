import { useEffect, useState } from "react";
import { Layout, TopBar } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";

interface Member {
  id: number;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

type MemberRow = Omit<Member, "role"> & {
  role?: string;
  tags?: string[];
};

export default function Members() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as MemberRow[] | { members?: MemberRow[] };
        setMembers(Array.isArray(data) ? data : data.members ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    try {
      const res = await fetch(`/api/members/${id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        toast({ title: "SUCCESS", description: `Member ${action}d successfully`, className: "border-[#00ff00] bg-black text-[#00ff00]" });
        fetchMembers();
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (err: any) {
      toast({ title: "ERROR", description: err.message, variant: "destructive" });
    }
  };

  const total = members.length;
  const pending = members.filter(m => m.status === "pending").length;
  const approved = members.filter(m => m.status === "approved").length;
  const rejected = members.filter(m => m.status === "rejected").length;

  return (
    <Layout>
      <TopBar title="SOCIOS // MEMBER MANAGEMENT">
        <span>TOTAL: {total}</span>
        <span style={{ color: "#555" }}>|</span>
        <span style={{ color: "#ffaa00" }}>PENDING: {pending}</span>
        <span style={{ color: "#555" }}>|</span>
        <span style={{ color: "#00ff00" }}>APPROVED: {approved}</span>
        <span style={{ color: "#555" }}>|</span>
        <span style={{ color: "#ff4444" }}>REJECTED: {rejected}</span>
      </TopBar>

      <div className="panel" style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "250px 100px 150px 1fr", gap: 10, background: "#0a0a0a", borderBottom: "1px solid #222", padding: "8px 12px", fontSize: 10, color: "#555", letterSpacing: "0.1em" }}>
          <span>EMAIL</span>
          <span>STATUS</span>
          <span>REGISTERED</span>
          <span>ACTIONS</span>
        </div>
        
        {loading ? (
          <div style={{ padding: 20, color: "#555", fontSize: 12 }}>&gt; loading members...</div>
        ) : members.length === 0 ? (
          <div style={{ padding: 20, color: "#555", fontSize: 12 }}>&gt; no members found.</div>
        ) : (
          members.map(member => (
            <div key={member.id} style={{ display: "grid", gridTemplateColumns: "250px 100px 150px 1fr", gap: 10, borderBottom: "1px solid #111", padding: "8px 12px", alignItems: "center", fontSize: 11 }}>
              <span style={{ color: "#ccc" }}>{member.email}</span>
              <span>
                {member.status === "pending" && <span style={{ background: "#332200", color: "#ffaa00", border: "1px solid #ffaa00", padding: "2px 6px", fontSize: 9 }}>PENDING</span>}
                {member.status === "approved" && <span style={{ background: "#002200", color: "#00ff00", border: "1px solid #00ff00", padding: "2px 6px", fontSize: 9 }}>APPROVED</span>}
                {member.status === "rejected" && <span style={{ background: "#220000", color: "#ff4444", border: "1px solid #ff4444", padding: "2px 6px", fontSize: 9 }}>REJECTED</span>}
              </span>
              <span style={{ color: "#666" }}>{new Date(member.createdAt).toLocaleDateString()}</span>
              <div style={{ display: "flex", gap: 8 }}>
                {member.status === "pending" && (
                  <>
                    <button onClick={() => handleAction(member.id, "approve")} className="cmd-btn" style={{ width: "auto", padding: "4px 8px", borderColor: "#00aa00", color: "#00aa00" }}>[ APROVAR ]</button>
                    <button onClick={() => handleAction(member.id, "reject")} className="cmd-btn danger" style={{ width: "auto", padding: "4px 8px" }}>[ REJEITAR ]</button>
                  </>
                )}
                {member.status === "approved" && (
                  <button onClick={() => handleAction(member.id, "reject")} className="cmd-btn danger" style={{ width: "auto", padding: "4px 8px" }}>[ REVOGAR ]</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
