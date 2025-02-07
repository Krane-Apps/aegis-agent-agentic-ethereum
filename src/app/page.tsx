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
  Mail,
  Bell,
  Zap,
  Database,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { useToast } from "src/components/ui/use-toast";
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
});

const networks = [
  { id: "ethereum", name: "Ethereum Mainnet" },
  { id: "base", name: "Base Mainnet" },
  { id: "base-sepolia", name: "Base Sepolia" },
];

// mock data
const trackedContracts = [
  {
    id: 1,
    address: "0x1234...5678",
    status: "Healthy",
    threatLevel: "Low",
    network: "ethereum",
  },
  {
    id: 2,
    address: "0xabcd...efgh",
    status: "Warning",
    threatLevel: "Medium",
    network: "ethereum",
  },
  {
    id: 3,
    address: "0x9876...5432",
    status: "Critical",
    threatLevel: "High",
    network: "ethereum",
  },
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
  const { toast } = useToast();
  const { address } = useAccount();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      network: "",
      contractAddress: "",
      emergencyFunction: "",
      emails: [""],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast({
      title: "Contract Monitoring Added",
      description: "We'll start monitoring this contract for security threats.",
    });
    setIsDialogOpen(false);
    form.reset();
  };

  const addEmailField = () => {
    const currentEmails = form.getValues("emails");
    form.setValue("emails", [...currentEmails, ""]);
  };

  return (
    <div className="min-h-screen bg-black w-full">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 pointer-events-none" />

      <div className="relative w-full px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Shield className="w-8 h-8 text-white" />
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
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Contract
                </Button>
              </DialogTrigger>
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
                                <SelectTrigger className="bg-gray-800/50 border-gray-700">
                                  <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {networks.map((network) => (
                                  <SelectItem
                                    key={network.id}
                                    value={network.id}
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
                                className="bg-gray-800/50 border-gray-700"
                              />
                            </FormControl>
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
                                className="bg-gray-800/50 border-gray-700"
                              />
                            </FormControl>
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
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="security@example.com"
                                  className="bg-gray-800/50 border-gray-700"
                                />
                              </FormControl>
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
          {/* Tracked Contracts Table */}
          <Card className="col-span-2 p-6 bg-gray-900/50 border-gray-800 backdrop-blur-sm overflow-hidden">
            <h2 className="text-xl font-semibold mb-6 text-white">
              Tracked Contracts on Ethereum
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Contract Address
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-gray-400 font-medium">
                      Threat Level
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trackedContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30"
                    >
                      <td className="py-3 px-4">
                        <span className="text-blue-400">
                          {contract.address}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(contract.status)}
                          <span className="text-gray-300">
                            {contract.status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={getThreatLevelColor(contract.threatLevel)}
                        >
                          {contract.threatLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Stats and Info Cards */}
          <div className="space-y-6">
            {/* Threat Detection Card */}
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

            {/* Active Monitoring Card */}
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
                  <p className="text-2xl font-bold text-white mt-1">3</p>
                </div>
                <div className="p-4 bg-black/30 rounded-lg">
                  <p className="text-sm text-gray-400">Alerts Today</p>
                  <p className="text-2xl font-bold text-white mt-1">2</p>
                </div>
              </div>
            </Card>

            {/* Alert Settings Card */}
            <Card className="p-6 bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-purple-900/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-400" />
                  Alert Settings
                </h3>
                <Mail className="text-purple-400" />
              </div>
              <p className="text-sm text-gray-300">
                Email notifications configured for immediate alerts on
                suspicious activities.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
