'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, FileText, Layers } from "lucide-react"

const sidebarItems = [
  { name: "Home", icon: Home, href: "/home" },
  { name: "Schemes", icon: Layers, href: "/schemess" },
  { name: "Documents", icon: FileText, href: "/documents" },
  { name: "Common Service Center", icon: Layers, href: "/csc" }
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed top-16 left-0 w-60 h-[calc(100vh-4rem)] bg-white border-r shadow-md">
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => (
          <Link key={item.name} href={item.href} passHref>
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg text-base font-medium transition-colors duration-200",
                pathname === item.href
                  ? "bg-blue-500 text-white shadow-sm"
                  : "text-gray-700 hover:bg-blue-100 hover:text-blue-600"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
