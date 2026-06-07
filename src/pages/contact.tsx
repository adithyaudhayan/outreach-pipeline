import { useState } from "react";
import {
  useGetContact, useUpdateContact, useDeleteContact,
  useListContactTouchpoints, useCreateTouchpoint,
  useListCampaigns, getGetContactQueryKey, getListContactTouchpointsQueryKey,
  getListContactsQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useRoute, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Linkedin, MessageSquare, ArrowLeft, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ContactDetail() {
  const [, params] = useRoute("/contacts/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contact, isLoading: contactLoading } = useGetContact(id, {
    query: { enabled: !isNaN(id) && id > 0, queryKey: getGetContactQueryKey(id) }
  });

  const { data: touchpoints, isLoading: touchpointsLoading } = useListContactTouchpoints(id, {
    query: { enabled: !isNaN(id) && id > 0, queryKey: getListContactTouchpointsQueryKey(id) }
  });

  const { data: campaigns } = useListCampaigns();

  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const handleStatusChange = (status: string) => {
    updateContact.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetContactQueryKey(id), data);
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        },
      }
    );
  };

  const handleCampaignChange = (value: string) => {
    const campaignId = value === "none" ? null : Number(value);
    updateContact.mutate(
      { id, data: { campaignId } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetContactQueryKey(id), data);
        },
        onError: () => {
          toast({ title: "Failed to update campaign", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${contact?.name}? This cannot be undone.`)) return;
    deleteContact.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
          setLocation("/contacts");
        },
        onError: () => {
          toast({ title: "Failed to delete contact", variant: "destructive" });
        },
      }
    );
  };

  if (contactLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!contact) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-24 text-muted-foreground">
          Contact not found.{" "}
          <button onClick={() => setLocation("/contacts")} className="text-primary hover:underline">
            Go back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <button
              onClick={() => setLocation("/contacts")}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to contacts
            </button>
            <h1 className="text-3xl font-semibold tracking-tight">{contact.name}</h1>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2">
              {contact.title && <span>{contact.title}</span>}
              {contact.title && contact.company && <span>•</span>}
              {contact.company && <span>{contact.company}</span>}
              {(contact.title || contact.company) && <span>•</span>}
              <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                {contact.email}
              </a>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Select value={contact.status} onValueChange={handleStatusChange} disabled={updateContact.isPending}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="unqualified">Unqualified</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
              title="Delete Contact"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Log Touchpoint</h2>
              <TouchpointForm contactId={id} />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                History{" "}
                {touchpoints && touchpoints.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">({touchpoints.length})</span>
                )}
              </h2>
              <div className="space-y-3">
                {touchpointsLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : touchpoints && touchpoints.length > 0 ? (
                  touchpoints.map((tp) => (
                    <div key={tp.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <TouchpointIcon type={tp.type} />
                          <span className="font-medium text-sm">{tp.subject}</span>
                        </div>
                        <div className="text-xs text-muted-foreground text-right flex flex-col gap-1 items-end">
                          <span>{new Date(tp.createdAt).toLocaleString()}</span>
                          {tp.outcome && (
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {tp.outcome.replace("_", " ")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {tp.body && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 border-t border-border pt-2">
                          {tp.body}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                    No touchpoints recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="font-medium">Details</h3>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Campaign</label>
                <Select
                  value={contact.campaignId?.toString() ?? "none"}
                  onValueChange={handleCampaignChange}
                  disabled={updateContact.isPending}
                >
                  <SelectTrigger className="w-full h-8 text-sm">
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {campaigns?.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {contact.linkedinUrl ? (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">LinkedIn</label>
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline block truncate"
                  >
                    {contact.linkedinUrl}
                  </a>
                </div>
              ) : null}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Added On</label>
                <div className="text-sm">{new Date(contact.createdAt).toLocaleDateString()}</div>
              </div>

              {contact.lastContactedAt && (
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Last Contacted
                  </label>
                  <div className="text-sm">{new Date(contact.lastContactedAt).toLocaleDateString()}</div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="font-medium">Stats</h3>
              <div>
                <div className="text-3xl font-semibold font-mono">{contact.touchpointCount}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Touchpoints</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function TouchpointForm({ contactId }: { contactId: number }) {
  const [type, setType] = useState<string>("email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [outcome, setOutcome] = useState<string>("none");

  const queryClient = useQueryClient();
  const createTouchpoint = useCreateTouchpoint();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    createTouchpoint.mutate(
      {
        id: contactId,
        data: {
          type: type as any,
          subject: subject.trim(),
          ...(body.trim() && { body: body.trim() }),
          ...(outcome !== "none" && { outcome: outcome as any }),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListContactTouchpointsQueryKey(contactId) });
          queryClient.invalidateQueries({ queryKey: getGetContactQueryKey(contactId) });
          setSubject("");
          setBody("");
          setOutcome("none");
          toast({ title: "Touchpoint logged" });
        },
        onError: () => {
          toast({ title: "Failed to log touchpoint", variant: "destructive" });
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger>
            <SelectValue placeholder="Outcome (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No outcome yet</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="no_answer">No Answer</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Input
        required
        placeholder="Subject / Summary"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />
      <Textarea
        placeholder="Notes or message body..."
        className="min-h-[90px]"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={createTouchpoint.isPending || !subject.trim()}>
          {createTouchpoint.isPending ? "Saving..." : "Log Activity"}
        </Button>
      </div>
    </form>
  );
}

function TouchpointIcon({ type }: { type: string }) {
  switch (type) {
    case "email":
      return <Mail className="w-4 h-4 text-muted-foreground" />;
    case "call":
      return <Phone className="w-4 h-4 text-muted-foreground" />;
    case "linkedin":
      return <Linkedin className="w-4 h-4 text-muted-foreground" />;
    default:
      return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
  }
}
