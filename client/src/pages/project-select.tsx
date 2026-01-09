import { MOCK_PROJECTS } from "@/lib/appContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";

interface ProjectSelectPageProps {
  onSelect: (projectId: string) => void;
}

export default function ProjectSelectPage({ onSelect }: ProjectSelectPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">اختر المشروع</h1>
          <p className="text-muted-foreground">حدد المشروع الذي تريد العمل عليه</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {MOCK_PROJECTS.map((project, index) => (
            <Card 
              key={project.id} 
              className="group hover:shadow-lg hover:border-primary/50 transition-all duration-200 cursor-pointer"
              onClick={() => onSelect(project.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    مشروع {index + 1}
                  </span>
                </div>
                <CardTitle className="text-xl mt-4">{project.name}</CardTitle>
                <CardDescription>
                  إدارة المعاملات والتقارير لهذا المشروع
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                  الدخول للمشروع
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
