import { useState } from "react";
import { useListContacts, useCreateContact, getListContactsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const params = {
    search: search.trim() || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  };

  const { data: contacts, isLoading } = useListContacts(params);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground mt-1">Manage your outreach prospects.</p>
          </div>
          <CreateContactDialog />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contacts..."
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <div className="col-span-4">Name</div>
            <div className="col-span-3">Company</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Added</div>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 p-4">
                  <div className="col-span-4"><Skeleton className="h-5 w-3/4" /></div>
                  <div className="col-span-3"><Skeleton className="h-5 w-1/2" /></div>
                  <div className="col-span-3"><Skeleton className="h-5 w-20" /></div>
                  <div className="col-span-2 flex justify-end"><Skeleton className="h-5 w-16" /></div>
                </div>
              ))
            ) : contacts && contacts.length > 0 ? (
              contacts.map((contact) => (
                <Link key={contact.id} href={`/contacts/${contact.id}`}>
                  <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="col-span-4 flex flex-col min-w-0">
                      <span className="font-medium text-foreground truncate">{contact.name}</span>
                      <span className="text-sm text-muted-foreground truncate">{contact.email}</span>
                    </div>
                    <div className="col-span-3 flex flex-col min-w-0">
                      <span className="text-sm truncate">{contact.company || "—"}</span>
                      <span className="text-xs text-muted-foreground truncate">{contact.title || "—"}</span>
                    </div>
                    <div className="col-span-3">
                      <StatusBadge status={contact.status} />
                    </div>
                    <div className="col-span-2 text-right text-sm text-muted-foreground">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                {search || statusFilter !== "all" ? "No contacts match your filter." : "No contacts yet. Add your first contact."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "default" | "secondary" | "outline"> = {
    qualified: "default",
    new: "outline",
    contacted: "secondary",
    replied: "secondary",
    unqualified: "outline",
  };
  return (
    <Badge variant={variantMap[status] ?? "secondary"} className="capitalize">
      {status}
    </Badge>
  );
}

function CreateContactDialog() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createContact = useCreateContact();
  const { toast } = useToast();

  const emptyForm = { name: "", email: "", company: "", title: "", linkedinUrl: "" };
  const [formData, setFormData] = useState(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      ...(formData.company.trim() && { company: formData.company.trim() }),
      ...(formData.title.trim() && { title: formData.title.trim() }),
      ...(formData.linkedinUrl.trim() && { linkedinUrl: formData.linkedinUrl.trim() }),
    };
    createContact.mutate(
      { data: payload },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
          setFormData(emptyForm);
          setOpen(false);
          setLocation(`/contacts/${data.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create contact", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFormData(emptyForm); }}>
      <DialogTrigger asChild>
        <Button><Plus className="w-4 h-4 mr-2" /> Add Contact</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email *</label>
            <Input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="jane@example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Inc"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="CEO"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">LinkedIn URL</label>
            <Input
              type="url"
              value={formData.linkedinUrl}
              onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createContact.isPending}>
              {createContact.isPending ? "Saving..." : "Save Contact"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
