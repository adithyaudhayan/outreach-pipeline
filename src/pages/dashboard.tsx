import { useGetStats, useListRecentContacts } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetStats();
  const { data: contacts, isLoading: contactsLoading } = useListRecentContacts();

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">Your outreach performance at a glance.</p>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Contacts" value={stats.totalContacts} />
            <StatCard title="Active Campaigns" value={stats.activeCampaigns} />
            <StatCard title="Reply Rate" value={`${(stats.replyRate * 100).toFixed(1)}%`} />
            <StatCard title="Qual Rate" value={`${(stats.qualificationRate * 100).toFixed(1)}%`} />
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Recent Contacts</h2>
            <Link href="/contacts">
              <span className="text-sm text-primary hover:underline cursor-pointer font-medium">View all</span>
            </Link>
          </div>

          <Card>
            <div className="divide-y divide-border">
              {contactsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))
              ) : contacts && contacts.length > 0 ? (
                contacts.map((contact) => (
                  <Link key={contact.id} href={`/contacts/${contact.id}`}>
                    <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div>
                        <div className="font-medium text-foreground">{contact.name}</div>
                        <div className="text-sm text-muted-foreground">{contact.company} • {contact.title}</div>
                      </div>
                      <Badge variant="secondary" className="capitalize">{contact.status}</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">No contacts yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono">{value}</div>
      </CardContent>
    </Card>
  );
}
