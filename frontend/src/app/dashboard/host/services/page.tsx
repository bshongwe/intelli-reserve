"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Clock, Users, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useServiceFilters } from "@/hooks/useServiceFilters";
import { useServiceSelection } from "@/hooks/useServiceSelection";
import { ServiceFilters } from "@/components/services/ServiceFilters";
import { BulkActionsBar } from "@/components/services/BulkActionsBar";
import { serviceSchema, type ServiceFormData } from "@/schemas/serviceSchema";
import { servicesAPI, type Service } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function HostServicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    control,
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      durationMinutes: 60,
      basePrice: 1000,
      maxParticipants: 1,
      isActive: true,
      category: "Photography",
    },
  });

  const { user } = useAuth();
  const hostId = user?.id ?? "";

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["host-services", hostId],
    queryFn: () => servicesAPI.getHostServices(hostId),
  });

  // Filter and search hook
  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    filteredServices,
  } = useServiceFilters(services);

  // Selection hook for bulk actions
  const {
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isAllSelected,
  } = useServiceSelection();

  // Mutations
  const createOrUpdateMutation = useMutation({
    mutationFn: async (service: ServiceFormData) => {
      if (editingService) {
        return servicesAPI.updateService(editingService.id, service);
      } else {
        return servicesAPI.createService(hostId, service);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-services", hostId] });
      toast({
        title: editingService ? "Service Updated" : "Service Created",
        description: "Your service has been saved successfully.",
      });
      setIsAddDialogOpen(false);
      setEditingService(null);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save service. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => servicesAPI.bulkDeleteServices(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-services", hostId] });
      toast({ title: "Services Deleted", variant: "destructive" });
      clearSelection();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete services.",
        variant: "destructive",
      });
    },
  });

  const bulkActivateMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        selectedIds.map((id) => servicesAPI.toggleServiceStatus(id, true))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-services", hostId] });
      toast({ title: `${selectedIds.length} services activated` });
      clearSelection();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate services.",
        variant: "destructive",
      });
    },
  });

  const bulkDeactivateMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(
        selectedIds.map((id) => servicesAPI.toggleServiceStatus(id, false))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["host-services", hostId] });
      toast({ title: `${selectedIds.length} services deactivated` });
      clearSelection();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to deactivate services.",
        variant: "destructive",
      });
    },
  });

  const openEdit = (service: Service) => {
    setEditingService(service);
    setValue("name", service.name);
    setValue("description", service.description);
    setValue("category", service.category as "Photography" | "Consulting" | "Workshop" | "Coaching" | "Other");
    setValue("durationMinutes", service.durationMinutes);
    setValue("basePrice", service.basePrice);
    setValue("maxParticipants", service.maxParticipants);
    setValue("isActive", service.isActive);
    setIsAddDialogOpen(true);
  };

  const onSubmit = (data: ServiceFormData) => {
    createOrUpdateMutation.mutate(data);
  };

  return (
    <div className="space-y-6 sm:space-y-8 py-4 sm:py-6 px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Services</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage your offerings and availability</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/host/services/calendar")}
            size="sm"
            className="gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Calendar
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingService(null);
                  reset();
                }}
                size="sm"
                className="gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] mx-3">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg sm:text-xl">
                  {editingService ? "Edit Service" : "Create New Service"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingService
                    ? "Update your service details"
                    : "Define a new service that customers can book"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Service Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm">
                      Service Name *
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="e.g. Portrait Photography Session"
                      className="text-xs sm:text-sm"
                      aria-invalid={!!errors.name}
                    />
                    {errors.name && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name.message}
                      </div>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs sm:text-sm">
                      Category *
                    </Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="category" className="text-xs sm:text-sm" aria-invalid={!!errors.category}>
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
                      )}
                    />
                    {errors.category && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.category.message}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="description" className="text-xs sm:text-sm">
                      Description *
                    </Label>
                    <Textarea
                      id="description"
                      {...register("description")}
                      rows={4}
                      placeholder="Describe what customers will receive..."
                      className="text-xs sm:text-sm resize-none"
                      aria-invalid={!!errors.description}
                    />
                    {errors.description && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description.message}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-xs sm:text-sm">
                      Duration (minutes) *
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      {...register("durationMinutes", { valueAsNumber: true })}
                      className="text-xs sm:text-sm"
                      aria-invalid={!!errors.durationMinutes}
                    />
                    {errors.durationMinutes && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.durationMinutes.message}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs sm:text-sm">
                      Base Price (R) *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      {...register("basePrice", { valueAsNumber: true })}
                      className="text-xs sm:text-sm"
                      aria-invalid={!!errors.basePrice}
                    />
                    {errors.basePrice && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.basePrice.message}
                      </div>
                    )}
                  </div>

                  {/* Max Participants */}
                  <div className="space-y-2">
                    <Label htmlFor="participants" className="text-xs sm:text-sm">
                      Max Participants *
                    </Label>
                    <Input
                      id="participants"
                      type="number"
                      {...register("maxParticipants", { valueAsNumber: true })}
                      className="text-xs sm:text-sm"
                      aria-invalid={!!errors.maxParticipants}
                    />
                    {errors.maxParticipants && (
                      <div className="flex items-center gap-1 text-xs text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {errors.maxParticipants.message}
                      </div>
                    )}
                  </div>

                  {/* Active Switch */}
                  <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                    <Controller
                      name="isActive"
                      control={control}
                      render={({ field }) => (
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      )}
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-medium">Active</p>
                      <p className="text-xs text-muted-foreground">
                        Customers can see and book this service
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                    size="sm"
                    className="text-xs sm:text-sm"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  {(() => {
                    if (createOrUpdateMutation.isPending) return "Saving...";
                    return editingService ? "Update Service" : "Create Service";
                  })()}
                  <Button
                    type="submit"
                    disabled={isSubmitting || createOrUpdateMutation.isPending}
                    size="sm"
                    className="text-xs sm:text-sm"
                  >
                    {(() => {
                      if (createOrUpdateMutation.isPending) return "Saving...";
                      return editingService ? "Update Service" : "Create Service";
                    })()}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <ServiceFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onActivate={() => bulkActivateMutation.mutate()}
        onDeactivate={() => bulkDeactivateMutation.mutate()}
        onDelete={() => deleteMutation.mutate(selectedIds)}
        onClearSelection={clearSelection}
        isLoading={
          bulkActivateMutation.isPending ||
          bulkDeactivateMutation.isPending ||
          deleteMutation.isPending
        }
      />

      {/* Services Table */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4 sm:pb-6 px-3 sm:px-6">
          <CardTitle className="text-lg sm:text-xl">Your Services ({filteredServices.length})</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Services that appear in the booking engine
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs sm:text-sm">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected(filteredServices.map((s) => s.id))}
                      onCheckedChange={() =>
                        toggleSelectAll(filteredServices.map((s) => s.id))
                      }
                    />
                  </TableHead>
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
                {filteredServices.map((service) => (
                  <TableRow key={service.id} className="text-xs sm:text-sm">
                    <TableCell className="py-2 sm:py-4">
                      <Checkbox
                        checked={selectedIds.includes(service.id)}
                        onCheckedChange={() => toggleSelect(service.id)}
                      />
                    </TableCell>
                    <TableCell className="py-2 sm:py-4">
                      <div className="min-w-0">
                        <p className="font-medium truncate text-xs sm:text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 hidden sm:block">
                          {service.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                      <Badge variant="secondary" className="text-xs">
                        {service.category}
                      </Badge>
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
                          onClick={() => openEdit(service as Service)}
                          className="p-1 sm:p-2 h-8 w-8 sm:h-auto sm:w-auto"
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="p-1 sm:p-2 h-8 w-8 sm:h-auto sm:w-auto text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate([service.id])}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredServices.length === 0 && (
              <div className="text-center py-12 text-xs sm:text-sm text-muted-foreground">
                {services.length === 0
                  ? "No services yet. Click \"Add Service\" to get started."
                  : "No services match your filters."}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
