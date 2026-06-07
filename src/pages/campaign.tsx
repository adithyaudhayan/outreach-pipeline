import { useGetCampaign, useUpdateCampaign, useDeleteCampaign, getGetCampaignQueryKey, getListCampaignsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useRoute, useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CampaignDetail() {
  const [, params] = useRoute("/campaigns/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaign, isLoading } = useGetCampaign(id, {
    query: { enabled: !isNaN(id) && id > 0, queryKey: getGetCampaignQueryKey(id) }
  });

  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();

  const handleStatusChange = (status: string) => {
    updateCampaign.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetCampaignQueryKey(id), data);
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        },
        onError: () => {
          toast({ title: "Failed to update status", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = () => {
    if (!confirm(`Delete "${campaign?.name}"? Contacts in this campaign will not be deleted.`)) return;
    deleteCampaign.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
          setLocation("/campaigns");
        },
        onError: () => {
          toast({ title: "Failed to delete campaign", variant: "destructive" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </Layout>
    );
  }

  if (!campaign) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-24 text-muted-foreground">
          Campaign not found.{" "}
          <button onClick={() => setLocation("/campaigns")} className="text-primary hover:underline">
            Go back
          </button>
        </div>
      </Layout>
    );
  }

  const replyRate = campaign.contactCount > 0
    ? Math.round(((campaign.repliedCount ?? 0) / campaign.contactCount) * 100)
    : 0;
  const qualRate = campaign.contactCount > 0
    ? Math.round(((campaign.qualifiedCount ?? 0) / campaign.contactCount) * 100)
    : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <button
              onClick={() => setLocation("/campaigns")}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to campaigns
            </button>
            <h1 className="text-3xl font-semibold tracking-tight">{campaign.name}</h1>
            {campaign.description && (
              <p className="text-muted-foreground max-w-2xl">{campaign.description}</p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Select value={campaign.status} onValueChange={handleStatusChange} disabled={updateCampaign.isPending}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteCampaign.isPending}
              title="Delete Campaign"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            value={campaign.contactCount}
            label="Total Contacts"
            icon={<Users className="w-4 h-4 text-muted-foreground" />}
          />
          <StatCard
            value={`${campaign.repliedCount ?? 0}`}
            label="Replied"
            sub={`${replyRate}% reply rate`}
          />
          <StatCard
            value={`${campaign.qualifiedCount ?? 0}`}
            label="Qualified"
            sub={`${qualRate}% qual rate`}
          />
        </div>

        <div className="rounded-lg border border-border bg-card p-6 space-y-3">
          <h2 className="text-base font-semibold text-muted-foreground uppercase tracking-wide text-xs">Details</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</div>
              <Badge variant={campaign.status === "active" ? "default" : "secondary"} className="capitalize">
                {campaign.status}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Created</div>
              <div className="text-sm">{new Date(campaign.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ value, label, sub, icon }: { value: string | number; label: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="text-4xl font-bold font-mono text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-2">{sub}</div>}
    </div>
  );
}
