/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Row {
  id: string;
  client: string | null;
  manager_id: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  client_name?: string | null;
  result?: any;
  creative_name?: string | null;
}

const statusToLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Rascunho", variant: "outline" },
  pending: { label: "Enviado", variant: "secondary" },
  queued: { label: "Enviado", variant: "secondary" },
  processing: { label: "Enviado", variant: "secondary" },
  processed: { label: "Processado", variant: "default" },
  error: { label: "Erro", variant: "destructive" },
};

const Manager: React.FC = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Meus Criativos • Jumper Flow";
  }, []);

  const fetchMy = async (): Promise<Row[]> => {
    if (!currentUser) {
      throw new Error("Não autenticado");
    }
    const { data, error } = await supabase.functions.invoke("j_hub_manager_dashboard", {
      body: {
        action: "listMy",
      },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || "Falha ao carregar");
    return (data.items || []) as Row[];
  };

  const { data: items = [], isFetching, refetch } = useQuery({ queryKey: ["manager", "my-submissions"], queryFn: fetchMy });

  const handleDelete = async (id: string) => {
    const { data, error } = await supabase.functions.invoke("j_hub_manager_dashboard", {
      body: { action: "deleteDraft", submissionId: id },
    });
    if (error || !data?.success) {
      toast({ title: "Falha ao apagar", description: data?.error || error?.message || "Tente novamente" });
      return;
    }
    toast({ title: "Rascunho apagado", description: "O rascunho foi removido." });
    refetch();
  };

  const drafts = useMemo(() => items.filter((i) => i.status === "draft"), [items]);
  const sent = useMemo(() => items.filter((i) => ["pending", "queued", "processing"].includes(i.status)), [items]);
  const processed = useMemo(() => items.filter((i) => i.status === "processed"), [items]);

  return (
    <>
      <Header />
      <main 
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
        role="main"
        aria-label="Gerenciamento de criativos"
      >
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Meus Criativos</h1>
            <p className="text-sm text-muted-foreground">Acompanhe rascunhos, envios e processados.</p>
          </div>
          <div className="flex gap-2" role="toolbar" aria-label="Ações de criativo">
            <Button 
              variant="outline" 
              onClick={() => refetch()} 
              size="sm"
              aria-label="Atualizar lista de criativos"
            >
              Atualizar
            </Button>
            <Link to="/create" className="no-underline">
              <Button size="sm" aria-label="Criar novo criativo">Novo Criativo</Button>
            </Link>
          </div>
        </header>

        <section className="space-y-4" aria-labelledby="drafts-heading">
          <h2 id="drafts-heading" className="text-lg font-medium text-foreground">Rascunhos</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Criativo</TableHead>
                    <TableHead className="w-[30%]">Conta</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[20%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {drafts.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum rascunho</TableCell>
                     </TableRow>
                   ) : drafts.map((row) => {
                     const criativo = row.creative_name || "Sem nome";
                     const conta = row.client_name || row.client || "—";
                     return (
                       <TableRow key={row.id}>
                         <TableCell>
                           <Link to={`/create?draft=${row.id}`} className="block">
                             <div className="flex flex-col hover:text-primary cursor-pointer">
                               <span className="font-medium text-foreground truncate max-w-[300px]" title={criativo}>{criativo}</span>
                               <span className="text-xs text-muted-foreground">ID: {row.id}</span>
                             </div>
                           </Link>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-col">
                             <span className="font-medium text-foreground truncate max-w-[250px]" title={conta}>{conta}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant={statusToLabel[row.status]?.variant || "outline"}>{statusToLabel[row.status]?.label || row.status}</Badge>
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex gap-2 justify-end">
                             <Link to={`/create?draft=${row.id}`}>
                               <Button variant="outline" size="sm">Editar</Button>
                             </Link>
                             <AlertDialog>
                               <AlertDialogTrigger asChild>
                                 <Button variant="destructive" size="sm">Apagar</Button>
                               </AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader>
                                   <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                   <AlertDialogDescription>Esta ação não pode ser desfeita. O rascunho será permanentemente removido.</AlertDialogDescription>
                                 </AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(row.id)}>Apagar</AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </div>
                         </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Enviados</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Criativo</TableHead>
                    <TableHead className="w-[30%]">Conta</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[20%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {sent.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center text-muted-foreground">Nada por aqui ainda</TableCell>
                     </TableRow>
                  ) : sent.map((row) => {
                    const criativo = row.creative_name || "Sem nome";
                    const conta = row.client_name || row.client || "—";
                     return (
                       <TableRow key={row.id}>
                         <TableCell>
                           <Button variant="ghost" className="p-0 h-auto text-left justify-start" onClick={() => toast({ title: "Detalhes", description: `Criativo ${criativo} foi enviado e está sendo processado.` })}>
                             <div className="flex flex-col hover:text-primary cursor-pointer">
                               <span className="font-medium text-foreground truncate max-w-[300px]" title={criativo}>{criativo}</span>
                               <span className="text-xs text-muted-foreground">ID: {row.id}</span>
                             </div>
                           </Button>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-col">
                             <span className="font-medium text-foreground truncate max-w-[250px]" title={conta}>{conta}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant={statusToLabel[row.status]?.variant || "outline"}>{statusToLabel[row.status]?.label || row.status}</Badge>
                         </TableCell>
                         <TableCell className="text-right">
                           <Button variant="outline" size="sm" onClick={() => toast({ title: "Enviado", description: "Criativo foi enviado e está sendo processado." })}>Ver</Button>
                         </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Processados</h2>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Criativo</TableHead>
                    <TableHead className="w-[30%]">Conta</TableHead>
                    <TableHead className="w-[15%]">Status</TableHead>
                    <TableHead className="w-[20%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {processed.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center text-muted-foreground">Sem criativos processados</TableCell>
                     </TableRow>
                  ) : processed.map((row) => {
                    const criativo = row.creative_name || "Sem nome";
                    const conta = row.client_name || row.client || "—";
                     return (
                       <TableRow key={row.id}>
                         <TableCell>
                           <Button variant="ghost" className="p-0 h-auto text-left justify-start" onClick={() => toast({ title: "Processado", description: `Criativo ${criativo} foi processado com sucesso e enviado ao Notion.` })}>
                             <div className="flex flex-col hover:text-primary cursor-pointer">
                               <span className="font-medium text-foreground truncate max-w-[300px]" title={criativo}>{criativo}</span>
                               <span className="text-xs text-muted-foreground">ID: {row.id}</span>
                             </div>
                           </Button>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-col">
                             <span className="font-medium text-foreground truncate max-w-[250px]" title={conta}>{conta}</span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant={statusToLabel[row.status]?.variant || "outline"}>{statusToLabel[row.status]?.label || row.status}</Badge>
                         </TableCell>
                         <TableCell className="text-right">
                           <Button variant="outline" size="sm" onClick={() => toast({ title: "Processado", description: "Criativo já enviado ao Notion." })}>Ver</Button>
                         </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </section>
      </main>
    </>
  );
};

export default Manager;
