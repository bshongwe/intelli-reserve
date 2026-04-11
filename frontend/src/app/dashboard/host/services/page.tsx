"use client";
/* eslint-disable no-nested-ternary */

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";

interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  basePrice: number;
  maxParticipants: number;
  isActive: boolean;
  category: string;
  createdAt: string;
}

const mockServices: Service[] = [
  {
    id: "svc-001",
    name: "Portrait Photography Session",
    description: "Professional studio or on-location portrait session including 10 edited photos.",
    durationMinutes: 90,
    basePrice: 2500,
    maxParticipants: 1,
    isActive: true,
    category: "Photography",
    createdAt: "2026-01-15",
  },
  {
    id: "svc-002",
    name: "Business Consulting Call",
    description: "1-on-1 strategy session for startups and small businesses.",
    durationMinutes: 60,
    basePrice: 1800,
    maxParticipants: 1,
    isActive: true,
    category: "Consulting",
    createdAt: "2026-02-01",
  },
  {
    id: "svc-003",
    name: "Group Workshop: Digital Marketing",
    description: "Interactive workshop for up to 12 participants.",
    durationMinutes: 180,
    basePrice: 850,
    maxParticipants: 12,
    isActive: false,
    category: "Workshop",
    createdAt: "2026-03-10",
  },
];

export default function HostServicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<Partial<Service>>({
    name: "",
    description: "",
    durationMinutes: 60,
    basePrice: 1000,
    maxParticipants: 1,
    isActive: true,
    category: "Photography",
  });

  // Fetch services (replace with real BFF call later)
  const { data: services = mockServices } = useQuery({
    queryKey: ["host-services"],
    queryFn: async () => mockServices, // Replace with axios.get("/api/bff/host/services")
  });

  const createOrUpdateMutation = useMutation({
    mutationFn: async (service: Partial<Service>) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));
      return service;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-services"] });
      toast({
        title: editingService ? "Service Updated" : "Service Created",
        description: "Your service has been saved successfully.",
      });
      setIsAddDialogOpen(false);
      setEditingService(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-services"] });
      toast({ title: "Service Deleted", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      durationMinutes: 60,
      basePrice: 1000,
      maxParticipants: 1,
      isActive: true,
      category: "Photography",
    });
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormData(service);
    setIsAddDialogOpen(true);
  };

  const getButtonText = () => {
    if (createOrUpdateMutation.isPending) return "Saving...";
    return editingService ? "Update Service" : "Create Service";
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      toast({ title: "Error", description: "Service name is required", variant: "destructive" });
      return;
    }
    createOrUpdateMutation.mutate({ ...formData, id: editingService?.id });
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Services</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your offerings and availability</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => { 
                setEditingService(null); 
                resetForm(); 
              }}
              size="sm"
              className="gap-2 text-xs sm:text-sm w-full sm:w-auto"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] mx-3">
            <DialogHeader className="text-left">
              <DialogTitle className="text-lg sm:text-xl">{editingService ? "Edit Service" : "Create New Service"}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {editingService ? "Update your service details" : "Define a new service that customers can book"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Service Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Portrait Photography Session"
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-xs sm:text-sm">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger id="category" className="text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Workshop">Workshop</SelectItem>
                    <SelectItem value="Coaching">Coaching</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Describe what customers will receive..."
                  className="text-xs sm:text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration" className="text-xs sm:text-sm">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: Number.parseInt(e.target.value) || 0 })}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-xs sm:text-sm">Base Price (R)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: Number.parseFloat(e.target.value) || 0 })}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="participants" className="text-xs sm:text-sm">Max Participants</Label>
                <Input
                  id="participants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: Number.parseInt(e.target.value) || 1 })}
                  className="text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <div>
                  <p className="text-xs sm:text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">Customers can see and book this service</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                size="sm"
                className="text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createOrUpdateMutation.isPending}
                size="sm"
                className="text-xs sm:text-sm"
              >
                {getButtonText()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-4 sm:pb-6 px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Your Services ({services.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Services that appear in the booking engine</CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs sm:text-sm">
                  <TableHead className="min-w-[180px] text-xs">Service</TableHead>
                  <TableHead className="hidden sm:table-cell text-xs">Category</TableHead>
                  <TableHead className="hidden md:table-cell text-xs">Duration</TableHead>
                  <TableHead className="text-xs">Price</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs">Max Pax</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id} className="text-xs sm:text-sm">
                    <TableCell className="py-2 sm:py-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate text-xs sm:text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">{service.description}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                      <Badge variant="secondary" className="text-xs">{service.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2 sm:py-4">
                      <div className="flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {service.durationMinutes}m
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4 font-medium text-xs sm:text-sm">
                      R{service.basePrice.toLocaleString()}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-2 sm:py-4">
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {service.maxParticipants}
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <Badge 
                        variant={service.isActive ? "default" : "secondary"} 
                        className="text-xs"
                      >
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right py-2 sm:py-4">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEdit(service)}
                          className="p-1 sm:p-2 h-8 w-8 sm:h-auto sm:w-auto"
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-1 sm:p-2 h-8 w-8 sm:h-auto sm:w-auto text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(service.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {services.length === 0 && (
              <div className="text-center py-12 text-xs sm:text-sm text-muted-foreground">
                No services yet. Click "Add Service" to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
