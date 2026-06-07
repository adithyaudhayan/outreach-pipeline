import { useState } from "react";
import { useListCampaigns, useCreateCampaign, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Campaigns() {
  const { data: campaigns, isLoading } = useListCampaigns();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-muted-foreground mt-1">Organize and track your outreach efforts.</p>
          </div>
          <CreateCampaignDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ))
          ) : campaigns && campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                <div className="rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer flex flex-col h-full">
                  <div className="p-5 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-base leading-tight truncate pr-2">{campaign.name}</h3>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{campaign.description}</p>
                    )}
                  </div>
                  <div className="px-5 py-4 border-t border-border bg-muted/20 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-lg font-semibold font-mono">{campaign.contactCount}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Contacts</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold font-mono">{campaign.repliedCount ?? 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Replies</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold font-mono">{campaign.qualifiedCount ?? 0}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">Qualified</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full p-12 text-center border border-dashed border-border rounded-lg text-muted-foreground">
              No campaigns yet. Create your first campaign to get started.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const variantMap: Record<string, "default" | "secondary" | "outline"> = {
    active: "default",
    draft: "outline",
    paused: "secondary",
    completed: "secondary",
  };
  return (
    <Badge variant={variantMap[status] ?? "secondary"} className="capitalize shrink-0">
      {status}
    </Badge>
  );
}

function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createCampaign = useCreateCampaign();
  const { toast } = useToast();

  const emptyForm = { name: "", description: "" };
  const [formData, setFormData] = useState(emptyForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    createCampaign.mutate(
      {
        data: {
          name: formData.name.trim(),
          ...(formData.description.trim() && { description: formData.description.trim() }),
          status: "draft",
        },
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          setFormData(emptyForm);
          setOpen(false);
          setLocation(`/campaigns/${data.id}`);
        },
        onError: () => {
          toast({ title: "Failed to create campaign", description: "Please try again.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setFormData(emptyForm); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Q3 Outbound"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Targeting mid-market logistics companies..."
              className="min-h-[80px]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCampaign.isPending || !formData.name.trim()}>
              {createCampaign.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
