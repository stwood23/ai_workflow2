import { PlusCircle, FileText, Files, Layers, Settings, Workflow, Copy, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  // Sample data for prompt templates
  const promptTemplates = [
    { id: 1, title: "Go-to-Market Strategy Plan", llm: "openai", date: "4/9/2025" },
    { id: 2, title: "Product Requirements Document", llm: "openai", date: "4/14/2025" },
    { id: 3, title: "Customer Persona Analysis", llm: "openai", date: "4/10/2025" },
    { id: 4, title: "Competitive Analysis Framework", llm: "openai", date: "4/8/2025" },
    { id: 5, title: "Marketing Campaign Brief", llm: "openai", date: "4/7/2025" },
    { id: 6, title: "User Story Template", llm: "openai", date: "4/5/2025" },
  ]

  return (
    <div className="flex h-screen bg-[#F7F8FC] font-inter">

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8 pl-12">
        <div className="mb-10 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-[#23203A]">Prompt Templates</h1>

          <Button className="rounded-full bg-gradient-to-r from-[#22965A] to-[#2AB090] px-8 py-6 text-base font-bold shadow-[0_4px_16px_rgba(34,150,90,0.16)] hover:shadow-[0_8px_32px_rgba(34,150,90,0.24)]">
            <PlusCircle size={20} className="mr-2" />
            Create New Prompt
          </Button>
        </div>

        {/* Table Layout */}
        <div className="rounded-3xl bg-white p-6 shadow-[0_8px_32px_rgba(84,77,227,0.08)]">
          <div className="overflow-hidden rounded-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F0F0F7] text-left">
                  <th className="px-6 py-5 text-lg font-medium text-[#A2A2A2]">Template Name</th>
                  <th className="px-6 py-5 text-lg font-medium text-[#A2A2A2]">LLM</th>
                  <th className="px-6 py-5 text-lg font-medium text-[#A2A2A2]">Last Updated</th>
                  <th className="px-6 py-5 text-left text-lg font-medium text-[#A2A2A2]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F7]">
                {promptTemplates.map((template) => (
                  <tr key={template.id} className="group transition-colors hover:bg-[#F7F8FC]">
                    <td className="px-6 py-5">
                      <div className="text-lg font-semibold text-[#23203A]">{template.title}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-base font-medium text-[#2AB090]">{template.llm}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-base text-[#A2A2A2]">{template.date}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex gap-3">
                        <button className="rounded-full p-2.5 text-[#A2A2A2] transition-all hover:bg-[#E6F7F0] hover:text-[#2AB090]">
                          <Copy size={18} />
                        </button>
                        <button className="rounded-full p-2.5 text-[#A2A2A2] transition-all hover:bg-[#E6F7F0] hover:text-[#2AB090]">
                          <Pencil size={18} />
                        </button>
                        <button className="rounded-full p-2.5 text-[#A2A2A2] transition-all hover:bg-[#ECECFC] hover:text-[#F67884]">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
