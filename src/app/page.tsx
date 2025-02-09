"use client";

import { useState } from "react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import {
  Shield,
  AlertTriangle,
  Activity,
  Zap,
  Database,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAccount } from "wagmi";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "src/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "src/components/ui/form";
import { Card } from "src/components/ui/card";
import SignupButton from "src/components/SignupButton";
import LoginButton from "src/components/LoginButton";
import { useContractMonitor } from "src/hooks/useContractMonitor";
import { LogsViewer } from "src/components/LogsViewer";
import Image from "next/image";

const formSchema = z.object({
  network: z.string().min(1, "Please select a network"),
  contractAddress: z
    .string()
    .min(1, "Contract address is required")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
  emergencyFunction: z.string().min(1, "Emergency function is required"),
  emails: z
    .array(z.string().email("Invalid email format"))
    .min(1, "At least one email is required"),
  description: z.string().optional(),
  subgraphUrl: z.string().url("Invalid URL format").optional(),
  alertThreshold: z.enum(["Low", "Medium", "High"]).default("Medium"),
  monitoringFrequency: z
    .enum(["1min", "5min", "15min", "30min", "1hour"])
    .default("5min"),
});

const networks = [
  { id: "ethereum", name: "Ethereum Mainnet" },
  { id: "base", name: "Base Mainnet" },
  { id: "base-sepolia", name: "Base Sepolia" },
];

const getThreatLevelColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "low":
      return "text-green-400";
    case "medium":
      return "text-yellow-400";
    case "high":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "healthy":
      return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    case "warning":
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case "critical":
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    default:
      return null;
  }
};

export default function Home() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { address } = useAccount();

  const {
    contracts,
    stats,
    alertSettings,
    loading,
    error,
    isUsingDummyData,
    addContract,
    deleteContract,
    refreshData,
  } = useContractMonitor();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      network: "",
      contractAddress: "",
      emergencyFunction: "",
      emails: [""],
      description: "",
      subgraphUrl: "",
      alertThreshold: "Medium",
      monitoringFrequency: "5min",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await addContract(values);
      toast.success("Contract Monitoring Added");
      setIsDialogOpen(false);
      form.reset();
      await refreshData(); // refresh all data
    } catch (error) {
      toast.error("Failed to add contract for monitoring.");
    }
  };

  const addEmailField = () => {
    const currentEmails = form.getValues("emails");
    form.setValue("emails", [...currentEmails, ""]);
  };

  return (
    <div className="min-h-screen bg-black w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 pointer-events-none" />

      <div className="relative w-full px-8 py-8">
        {isUsingDummyData && (
          <div className="mb-6 p-4 bg-yellow-900/50 border border-yellow-600 rounded-lg text-yellow-200 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <p>
                <span className="font-semibold">Backend Service Down:</span>{" "}
                You're currently viewing placeholder data. Please contact the
                administrator to restart the service.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl p-4 bg-gradient-to-br from-blue-900/80 via-purple-900/80 to-pink-900/80 shadow-lg hover:shadow-blue-900/30 transition-all duration-300 backdrop-blur-sm border border-blue-950/50">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-800/20 via-purple-800/20 to-pink-800/20 animate-gradient-slow" />
              <Image
                src="/aegislogo.png"
                alt="Aegis Logo"
                fill
                className="object-contain p-0"
                priority
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Aegis AI Agent
              </h1>
              <p className="text-gray-400">
                Advanced Smart Contract Security Monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SignupButton />
            {!address && <LoginButton />}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              {address && (
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Contract
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between pr-0">
                  <DialogTitle className="text-xl font-semibold text-white flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-400" />
                    Add Contract for Monitoring
                  </DialogTitle>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogHeader>

                <div className="pr-1">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4 mt-4"
                    >
                      <FormField
                        control={form.control}
                        name="network"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Blockchain Network
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                  <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                {networks.map((network) => (
                                  <SelectItem
                                    key={network.id}
                                    value={network.id}
                                    className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                  >
                                    {network.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="contractAddress"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Contract Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="0x..."
                                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Description (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Brief description of the contract"
                                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subgraphUrl"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Subgraph URL (Optional)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="https://api.studio.thegraph.com/query/your-subgraph"
                                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                              />
                            </FormControl>
                            <p className="text-xs text-gray-500">
                              Add your subgraph URL to enable advanced
                              monitoring with The Graph Protocol data
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyFunction"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Emergency Function
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="pause()"
                                className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="alertThreshold"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Alert Threshold
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                  <SelectValue placeholder="Select threshold" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem
                                  value="Low"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Low
                                </SelectItem>
                                <SelectItem
                                  value="Medium"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Medium
                                </SelectItem>
                                <SelectItem
                                  value="High"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  High
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="monitoringFrequency"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel className="text-gray-300">
                              Monitoring Frequency
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem
                                  value="1min"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Every minute
                                </SelectItem>
                                <SelectItem
                                  value="5min"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Every 5 minutes
                                </SelectItem>
                                <SelectItem
                                  value="15min"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Every 15 minutes
                                </SelectItem>
                                <SelectItem
                                  value="30min"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Every 30 minutes
                                </SelectItem>
                                <SelectItem
                                  value="1hour"
                                  className="text-white hover:bg-gray-700 focus:bg-gray-700"
                                >
                                  Every hour
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("emails").map((_: any, index: any) => (
                        <FormField
                          key={index}
                          control={form.control}
                          name={`emails.${index}`}
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel className="text-gray-300">
                                {index === 0
                                  ? "Alert Email"
                                  : `Additional Email ${index + 1}`}
                              </FormLabel>
                              <div className="flex gap-2">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="security@example.com"
                                    className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500"
                                  />
                                </FormControl>
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    className="px-3"
                                    onClick={() => {
                                      const emails = form.getValues("emails");
                                      emails.splice(index, 1);
                                      form.setValue("emails", [...emails]);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ))}

                      <div className="space-y-4 pt-4">
                        <Button
                          type="button"
                          onClick={addEmailField}
                          variant="outline"
                          className="border-gray-700 hover:bg-gray-800 w-full"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Another Email
                        </Button>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                        >
                          Start Monitoring
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="col-span-2 p-6 bg-gray-900/50 backdrop-blur-sm">
            <LogsViewer />
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-red-900/50 to-orange-900/50 border-red-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  Threat Detection
                </h3>
                <AlertTriangle className="text-orange-400" />
              </div>
              <p className="text-sm text-gray-300">
                Monitoring for 50+ threat patterns including:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Flash Loan Attacks
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Reentrancy Vulnerabilities
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Oracle Manipulation
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                  Access Control Issues
                </li>
              </ul>
            </Card>

            {/* Active Monitoring Stats */}
            <Card className="p-6 bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Active Monitoring
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-sm text-gray-400">Contracts Monitored</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.contractsMonitored || 0}
                  </p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-sm text-gray-400">Alerts Today</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stats?.alertsToday || 0}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <h2 className="text-lg font-medium text-white mb-4">
                Tracked Contracts
              </h2>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="text-center text-gray-400 py-4">
                    Loading contracts...
                  </div>
                ) : contracts.length === 0 ? (
                  <div className="text-center text-gray-400 py-4">
                    No contracts being monitored yet
                  </div>
                ) : (
                  contracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="p-4 bg-black/30 rounded-lg border border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <div className="mb-3">
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                          {contract.description || "Unnamed Contract"}
                          {contract.subgraphUrl && (
                            <span
                              className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full"
                              title="Enhanced monitoring with The Graph"
                            >
                              Graph
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-blue-400">
                          {contract.address}
                        </span>
                        <span className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300">
                          {contract.network}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(contract.status)}
                          <span className="text-sm text-gray-300">
                            {contract.status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              contract.threatLevel === "Low"
                                ? "bg-green-500/20 text-green-400"
                                : contract.threatLevel === "Medium"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {contract.threatLevel}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={async () => {
                            try {
                              await deleteContract(contract.id);
                              toast.success("Contract Removed");
                            } catch (error) {
                              toast.error("Failed to remove contract.");
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
