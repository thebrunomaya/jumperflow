/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ManagerForm - Form for editing manager data
 */

import { useState } from "react";
import { NotionManager } from "@/hooks/useMyManagers";
import { ManagerUpdates, useManagerUpdate } from "@/hooks/useManagerUpdate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";

interface ManagerFormProps {
  manager: NotionManager;
  onSuccess: () => void;
  onCancel: () => void;
}

const FUNCAO_OPTIONS = ["Gerente", "Diretor", "Coordenador", "Analista", "Assistente"];

export function ManagerForm({ manager, onSuccess, onCancel }: ManagerFormProps) {
  const { updateManager, isUpdating } = useManagerUpdate();

  // Form state
  const [formData, setFormData] = useState({
    Nome: manager.nome || "",
    "E-Mail": manager.email || "",
    Telefone: manager.telefone || "",
    Funcao: manager.funcao || [],
  });

  // Track which fields have changed
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setChangedFields(prev => new Set(prev).add(field));
  };

  const handleAddFuncao = (funcao: string) => {
    if (!formData.Funcao.includes(funcao)) {
      handleFieldChange("Funcao", [...formData.Funcao, funcao]);
    }
  };

  const handleRemoveFuncao = (funcao: string) => {
    handleFieldChange(
      "Funcao",
      formData.Funcao.filter(f => f !== funcao)
    );
  };

  const handleSubmit = async () => {
    // Only send changed fields
    const updates: ManagerUpdates = {};

    changedFields.forEach(field => {
      (updates as any)[field] = (formData as any)[field];
    });

    if (Object.keys(updates).length === 0) {
      onCancel();
      return;
    }

    const result = await updateManager(manager.id, updates);

    if (result.success) {
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            value={formData.Nome}
            onChange={e => handleFieldChange("Nome", e.target.value)}
            placeholder="Nome do gerente"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-Mail</Label>
          <Input
            id="email"
            type="email"
            value={formData["E-Mail"]}
            onChange={e => handleFieldChange("E-Mail", e.target.value)}
            placeholder="email@empresa.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            type="tel"
            value={formData.Telefone}
            onChange={e => handleFieldChange("Telefone", e.target.value)}
            placeholder="+55 11 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <Label>Função</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.Funcao.map(funcao => (
              <Badge key={funcao} variant="secondary" className="gap-1">
                {funcao}
                <button
                  type="button"
                  onClick={() => handleRemoveFuncao(funcao)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <Select onValueChange={handleAddFuncao}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar função" />
            </SelectTrigger>
            <SelectContent>
              {FUNCAO_OPTIONS.filter(f => !formData.Funcao.includes(f)).map(funcao => (
                <SelectItem key={funcao} value={funcao}>
                  {funcao}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
