/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AccountForm - Form for editing account data with tabs
 */

import { useState, useEffect } from "react";
import { NotionAccount } from "@/hooks/useMyNotionAccounts";
import { AccountUpdates, useAccountUpdate } from "@/hooks/useAccountUpdate";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { X, Loader2 } from "lucide-react";
import { WooCommerceSyncControl } from "./WooCommerceSyncControl";
import { ReportDispatchControl } from "./ReportDispatchControl";

// Staff user for team selection
interface StaffUser {
  id: string;
  email: string;
  nome: string | null;
}

interface AccountFormProps {
  account: NotionAccount;
  onSuccess: () => void;
  onCancel: () => void;
}

const STATUS_OPTIONS = ["Ativo", "Inativo", "Offboarding", "Onboarding"];

const OBJETIVOS_OPTIONS = [
  "Vendas",
  "Tráfego",
  "Leads",
  "Engajamento",
  "Reconhecimento",
  "Alcance",
  "Video",
  "Conversões",
  "Seguidores",
  "Conversas",
  "Cadastros",
];

const PAYMENT_OPTIONS = ["Boleto", "Cartão", "Faturamento", "Misto"];

export function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const { updateAccount, isUpdating } = useAccountUpdate();

  // Staff users for team selection
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    Conta: account.name || "",
    Status: account.status || "Ativo",
    Tier: account.tier ? parseInt(account.tier) : 3,
    Objetivos: account.objectives || [],
    Nicho: account.nicho || [],
    "ID Meta Ads": account.meta_ads_id || "",
    "ID Google Ads": account.id_google_ads || "",
    "ID Tiktok Ads": account.id_tiktok_ads || "",
    "ID Google Analytics": account.id_google_analytics || "",
    "Contexto para Otimizacao": account.contexto_otimizacao || "",
    "Contexto para Transcricao": account.contexto_transcricao || "",
    "Metodo de Pagamento": account.payment_method || "",
    "META: Verba Mensal": account.meta_verba_mensal || "",
    "G-ADS: Verba Mensal": account.gads_verba_mensal || "",
    "Woo Site URL": account.woo_site_url || "",
    "Woo Consumer Key": account.woo_consumer_key || "",
    "Woo Consumer Secret": account.woo_consumer_secret || "",
    // Report configuration
    report_enabled: account.report_enabled || false,
    report_roas_target: account.report_roas_target || "",
    report_cpa_max: account.report_cpa_max || "",
    report_conv_min: account.report_conv_min || "",
    report_daily_target: account.report_daily_target || "",
    report_whatsapp_numbers: account.report_whatsapp_numbers || [],
  });

  // Selected user IDs for team fields
  const [gestorUserIds, setGestorUserIds] = useState<string[]>([]);
  const [atendimentoUserIds, setAtendimentoUserIds] = useState<string[]>([]);

  // Track which fields have changed
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  // Fetch staff users on mount
  useEffect(() => {
    async function fetchStaffUsers() {
      const { data, error } = await supabase
        .from("j_hub_users")
        .select("id, email, nome")
        .in("role", ["admin", "staff"])
        .order("nome", { ascending: true });

      if (!error && data) {
        setStaffUsers(data);

        // Initialize selected users based on current account emails
        const gestorEmails = (account.gestor_email || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);
        const atendimentoEmails = (account.atendimento_email || "").toLowerCase().split(",").map(e => e.trim()).filter(Boolean);

        const gestorIds = data.filter(u => gestorEmails.includes(u.email.toLowerCase())).map(u => u.id);
        const atendimentoIds = data.filter(u => atendimentoEmails.includes(u.email.toLowerCase())).map(u => u.id);

        setGestorUserIds(gestorIds);
        setAtendimentoUserIds(atendimentoIds);
      }
      setLoadingStaff(false);
    }
    fetchStaffUsers();
  }, [account]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setChangedFields(prev => new Set(prev).add(field));
  };

  const handleAddObjetivo = (objetivo: string) => {
    if (!formData.Objetivos.includes(objetivo)) {
      handleFieldChange("Objetivos", [...formData.Objetivos, objetivo]);
    }
  };

  const handleRemoveObjetivo = (objetivo: string) => {
    handleFieldChange(
      "Objetivos",
      formData.Objetivos.filter(o => o !== objetivo)
    );
  };

  // Team handlers
  const handleAddGestor = (userId: string) => {
    if (!gestorUserIds.includes(userId)) {
      setGestorUserIds(prev => [...prev, userId]);
      setChangedFields(prev => new Set(prev).add("Gestor_user_ids"));
    }
  };

  const handleRemoveGestor = (userId: string) => {
    setGestorUserIds(prev => prev.filter(id => id !== userId));
    setChangedFields(prev => new Set(prev).add("Gestor_user_ids"));
  };

  const handleAddAtendimento = (userId: string) => {
    if (!atendimentoUserIds.includes(userId)) {
      setAtendimentoUserIds(prev => [...prev, userId]);
      setChangedFields(prev => new Set(prev).add("Atendimento_user_ids"));
    }
  };

  const handleRemoveAtendimento = (userId: string) => {
    setAtendimentoUserIds(prev => prev.filter(id => id !== userId));
    setChangedFields(prev => new Set(prev).add("Atendimento_user_ids"));
  };

  const handleSubmit = async () => {
    // Only send changed fields
    const updates: AccountUpdates = {};

    changedFields.forEach(field => {
      // Handle team fields separately
      if (field === "Gestor_user_ids") {
        updates.Gestor_user_ids = gestorUserIds;
      } else if (field === "Atendimento_user_ids") {
        updates.Atendimento_user_ids = atendimentoUserIds;
      } else {
        (updates as any)[field] = (formData as any)[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    const result = await updateAccount(account.id, updates);

    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="basico" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basico">Básico</TabsTrigger>
          <TabsTrigger value="equipe">Equipe</TabsTrigger>
          <TabsTrigger value="plataformas">Plataformas</TabsTrigger>
          <TabsTrigger value="ai">AI Context</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        {/* Aba Básico */}
        <TabsContent value="basico" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="conta">Nome da Conta</Label>
            <Input
              id="conta"
              value={formData.Conta}
              onChange={e => handleFieldChange("Conta", e.target.value)}
              placeholder="Nome da conta"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.Status}
                onValueChange={value => handleFieldChange("Status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier">Tier (1-5)</Label>
              <Input
                id="tier"
                type="number"
                min={1}
                max={5}
                value={formData.Tier}
                onChange={e => handleFieldChange("Tier", parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Objetivos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.Objetivos.map(obj => (
                <Badge key={obj} variant="secondary" className="gap-1">
                  {obj}
                  <button
                    type="button"
                    onClick={() => handleRemoveObjetivo(obj)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={handleAddObjetivo}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar objetivo" />
              </SelectTrigger>
              <SelectContent>
                {OBJETIVOS_OPTIONS.filter(o => !formData.Objetivos.includes(o)).map(obj => (
                  <SelectItem key={obj} value={obj}>
                    {obj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Aba Equipe */}
        <TabsContent value="equipe" className="space-y-4 mt-4">
          {loadingStaff ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando usuários...
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Gestor</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {gestorUserIds.map(userId => {
                    const user = staffUsers.find(u => u.id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {user?.nome || user?.email || userId}
                        <button
                          type="button"
                          onClick={() => handleRemoveGestor(userId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <Select onValueChange={handleAddGestor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar gestor" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.filter(u => !gestorUserIds.includes(u.id)).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Atendimento</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {atendimentoUserIds.map(userId => {
                    const user = staffUsers.find(u => u.id === userId);
                    return (
                      <Badge key={userId} variant="secondary" className="gap-1">
                        {user?.nome || user?.email || userId}
                        <button
                          type="button"
                          onClick={() => handleRemoveAtendimento(userId)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
                <Select onValueChange={handleAddAtendimento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Adicionar atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.filter(u => !atendimentoUserIds.includes(u.id)).map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.nome || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </TabsContent>

        {/* Aba Plataformas */}
        <TabsContent value="plataformas" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="metaAds">ID Meta Ads</Label>
            <Input
              id="metaAds"
              value={formData["ID Meta Ads"]}
              onChange={e => handleFieldChange("ID Meta Ads", e.target.value)}
              placeholder="1234567890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleAds">ID Google Ads</Label>
            <Input
              id="googleAds"
              value={formData["ID Google Ads"]}
              onChange={e => handleFieldChange("ID Google Ads", e.target.value)}
              placeholder="123-456-7890"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiktokAds">ID TikTok Ads</Label>
            <Input
              id="tiktokAds"
              value={formData["ID Tiktok Ads"]}
              onChange={e => handleFieldChange("ID Tiktok Ads", e.target.value)}
              placeholder="ID da conta TikTok"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ga">ID Google Analytics</Label>
            <Input
              id="ga"
              value={formData["ID Google Analytics"]}
              onChange={e => handleFieldChange("ID Google Analytics", e.target.value)}
              placeholder="G-XXXXXXXXXX"
            />
          </div>

          {/* WooCommerce Section */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">WooCommerce</h4>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wooUrl">Site URL</Label>
                <Input
                  id="wooUrl"
                  value={formData["Woo Site URL"]}
                  onChange={e => handleFieldChange("Woo Site URL", e.target.value)}
                  placeholder="https://loja.exemplo.com.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wooKey">Consumer Key</Label>
                <Input
                  id="wooKey"
                  value={formData["Woo Consumer Key"]}
                  onChange={e => handleFieldChange("Woo Consumer Key", e.target.value)}
                  placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wooSecret">Consumer Secret</Label>
                <Input
                  id="wooSecret"
                  type="password"
                  value={formData["Woo Consumer Secret"]}
                  onChange={e => handleFieldChange("Woo Consumer Secret", e.target.value)}
                  placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Credenciais de API do WooCommerce (REST API)
                </p>
              </div>

              {/* Sync Control */}
              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Sincronizacao de Dados</h4>
                <WooCommerceSyncControl
                  accountId={account.id}
                  hasWooConfig={Boolean(
                    account.woo_site_url &&
                    account.woo_consumer_key &&
                    account.woo_consumer_secret
                  )}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Aba AI Context */}
        <TabsContent value="ai" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="contextoOtimizacao">Contexto para Otimização</Label>
            <p className="text-xs text-muted-foreground">
              Usado pela IA ao analisar gravações de otimização
            </p>
            <Textarea
              id="contextoOtimizacao"
              value={formData["Contexto para Otimizacao"]}
              onChange={e => handleFieldChange("Contexto para Otimizacao", e.target.value)}
              placeholder="Descreva o contexto da conta, produtos, público-alvo..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contextoTranscricao">Contexto para Transcrição</Label>
            <p className="text-xs text-muted-foreground">
              Usado pelo Whisper para melhorar a transcrição de áudio
            </p>
            <Textarea
              id="contextoTranscricao"
              value={formData["Contexto para Transcricao"]}
              onChange={e => handleFieldChange("Contexto para Transcricao", e.target.value)}
              placeholder="Termos específicos, nomes de campanhas, produtos..."
              rows={4}
            />
          </div>
        </TabsContent>

        {/* Aba Financeiro */}
        <TabsContent value="financeiro" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="pagamento">Método de Pagamento</Label>
            <Select
              value={formData["Metodo de Pagamento"]}
              onValueChange={value => handleFieldChange("Metodo de Pagamento", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_OPTIONS.map(method => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="verbaMeta">META: Verba Mensal</Label>
              <Input
                id="verbaMeta"
                value={formData["META: Verba Mensal"]}
                onChange={e => handleFieldChange("META: Verba Mensal", e.target.value)}
                placeholder="R$ 10.000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verbaGoogle">G-ADS: Verba Mensal</Label>
              <Input
                id="verbaGoogle"
                value={formData["G-ADS: Verba Mensal"]}
                onChange={e => handleFieldChange("G-ADS: Verba Mensal", e.target.value)}
                placeholder="R$ 5.000"
              />
            </div>
          </div>
        </TabsContent>

        {/* Aba Relatórios */}
        <TabsContent value="relatorios" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reportEnabled">Relatório Diário WhatsApp</Label>
              <p className="text-xs text-muted-foreground">
                Enviar automaticamente relatório de performance às 8h
              </p>
            </div>
            <Switch
              id="reportEnabled"
              checked={formData.report_enabled}
              onCheckedChange={checked => handleFieldChange("report_enabled", checked)}
            />
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Metas de Performance</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roasTarget">ROAS Alvo</Label>
                <Input
                  id="roasTarget"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.report_roas_target}
                  onChange={e => handleFieldChange("report_roas_target", e.target.value)}
                  placeholder="3.5"
                />
                <p className="text-xs text-muted-foreground">Ex: 3.5 para ROAS 3.5x</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpaMax">CPA Máximo (R$)</Label>
                <Input
                  id="cpaMax"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.report_cpa_max}
                  onChange={e => handleFieldChange("report_cpa_max", e.target.value)}
                  placeholder="80"
                />
                <p className="text-xs text-muted-foreground">Custo por aquisição máximo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="convMin">Conversão Mínima (%)</Label>
                <Input
                  id="convMin"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.report_conv_min}
                  onChange={e => handleFieldChange("report_conv_min", e.target.value)}
                  placeholder="1.5"
                />
                <p className="text-xs text-muted-foreground">Taxa de conversão mínima</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyTarget">Meta Diária (R$)</Label>
                <Input
                  id="dailyTarget"
                  type="number"
                  step="100"
                  min="0"
                  value={formData.report_daily_target}
                  onChange={e => handleFieldChange("report_daily_target", e.target.value)}
                  placeholder="5000"
                />
                <p className="text-xs text-muted-foreground">Meta de vendas diária</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Números WhatsApp</h4>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.report_whatsapp_numbers.map((phone, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    {phone}
                    <button
                      type="button"
                      onClick={() => {
                        const newNumbers = formData.report_whatsapp_numbers.filter((_, i) => i !== idx);
                        handleFieldChange("report_whatsapp_numbers", newNumbers);
                      }}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  id="newPhone"
                  placeholder="5511999999999 ou ID@g.us"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const value = input.value.trim();
                      // Accept group IDs (ending with @g.us) or phone numbers (digits only)
                      const recipient = value.includes("@g.us")
                        ? value
                        : value.replace(/\D/g, "");
                      if (recipient && !formData.report_whatsapp_numbers.includes(recipient)) {
                        handleFieldChange("report_whatsapp_numbers", [...formData.report_whatsapp_numbers, recipient]);
                        input.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById("newPhone") as HTMLInputElement;
                    const value = input.value.trim();
                    // Accept group IDs (ending with @g.us) or phone numbers (digits only)
                    const recipient = value.includes("@g.us")
                      ? value
                      : value.replace(/\D/g, "");
                    if (recipient && !formData.report_whatsapp_numbers.includes(recipient)) {
                      handleFieldChange("report_whatsapp_numbers", [...formData.report_whatsapp_numbers, recipient]);
                      input.value = "";
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Numero: 5511999999999 | Grupo: 123456789@g.us
              </p>
            </div>
          </div>

          {/* Manual Dispatch Control */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Disparo Manual</h4>
            <ReportDispatchControl
              accountId={account.id}
              hasReportEnabled={formData.report_enabled || account.report_enabled}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} disabled={isUpdating}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isUpdating || changedFields.size === 0}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Alterações"
          )}
        </Button>
      </div>

      {changedFields.size > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {changedFields.size} campo(s) modificado(s)
        </p>
      )}
    </div>
  );
}
