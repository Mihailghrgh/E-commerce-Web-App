"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrderItem from "./OrderItemProp";
import { useEffect, useState } from "react";
import { Order, Prisma } from "@prisma/client";
import errorMap from "zod/locales/en.js";
import axios from "axios";
import SectionTitle from "../global/SectionTitle";

type Orders = Prisma.OrderGetPayload<{}>;

function AdminOrderPage() {
  const [orders, setOrders] = useState<Orders[]>();

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/products?type=fetchUserOrders");
      console.log(data);
      setOrders(data);
    } catch (error: any) {
      console.log(errorMap);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (!orders) {
    return <SectionTitle text="No orders placed by any user yet" />;
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All user Orders</h1>
          <p className="text-muted-foreground">
            View and track all your past orders
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-[250px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              className="w-full pl-8"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {orders.map((item) => {
        return <SectionTitle text="Section title" />;
      })}
      <div className="space-y-6">
        {/* <OrderItem
          id="ORD-3429"
          date="April 12, 2023"
          status="Delivered"
          items={[
            {
              id: "1",
              name: "Wireless Noise-Cancelling Headphones",
              company: "SoundWave",
              price: 249.99,
              image: "/placeholder.svg?height=80&width=80",
              quantity: 1,
            },
            {
              id: "2",
              name: "Bluetooth Portable Speaker",
              company: "SoundWave",
              price: 129.99,
              image: "/placeholder.svg?height=80&width=80",
              quantity: 1,
            },
          ]}
          shipping={8.99}
        /> */}
      </div>
    </div>
  );
}

export default AdminOrderPage;
