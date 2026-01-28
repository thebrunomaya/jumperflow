 
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Copy,
  Check,
  Loader2,
  Globe,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeckShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deckId: string;
  deckTitle: string;
  currentSlug?: string | null;
  isPublic?: boolean;
  onShareComplete?: (shareUrl: string) => void;
}

export function DeckShareModal({
  open,
  onOpenChange,
  deckId,
  deckTitle,
  currentSlug,
  isPublic = false,
  onShareComplete,
}: DeckShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(
    currentSlug ? `${window.location.origin}/decks/share/${currentSlug}` : null
  );
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateLink = async () => {
    try {
      // Validate password if enabled
      if (passwordEnabled) {
        if (!password || password.length < 6) {
          toast.error("Senha inválida", {
            description: "A senha deve ter no mínimo 6 caracteres",
          });
          return;
        }
      }

      setIsGenerating(true);

      const { data, error } = await supabase.functions.invoke("j_hub_deck_create_share", {
        body: {
          deck_id: deckId,
          password: passwordEnabled ? password : undefined,
        },
      });

      if (error) throw error;
      if (!data || !data.success) {
        throw new Error(data?.error || "Falha ao gerar link");
      }

      const url = data.url;
      setShareUrl(url);

      toast.success("Link gerado com sucesso!", {
        description: passwordEnabled
          ? "Deck compartilhado com proteção de senha"
          : "Deck compartilhado publicamente",
      });

      onShareComplete?.(url);
    } catch (err) {
      console.error("Error generating share link:", err);
      toast.error("Erro ao gerar link", {
        description: err.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copiado!");

      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
      toast.error("Erro ao copiar link");
    }
  };

  const handleRevokeShare = async () => {
    const confirmed = window.confirm(
      "Tem certeza que deseja revogar o compartilhamento? O link público deixará de funcionar."
    );

    if (!confirmed) return;

    try {
      setIsGenerating(true);

      const { error } = await supabase
        .from("j_hub_decks")
        .update({
          slug: null,
          is_public: false,
          password_hash: null,
        })
        .eq("id", deckId);

      if (error) throw error;

      setShareUrl(null);
      toast.success("Compartilhamento revogado", {
        description: "O deck agora é privado",
      });

      onOpenChange(false);
    } catch (err) {
      console.error("Error revoking share:", err);
      toast.error("Erro ao revogar compartilhamento", {
        description: err.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenLink = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Compartilhar Deck
          </DialogTitle>
          <DialogDescription>
            {shareUrl
              ? "Deck compartilhado com sucesso. Copie o link abaixo:"
              : "Crie um link público para compartilhar este deck"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Deck title */}
          <div>
            <Label className="text-sm font-medium">Deck</Label>
            <p className="text-sm text-muted-foreground mt-1 truncate">{deckTitle}</p>
          </div>

          {/* Share URL (if generated) */}
          {shareUrl ? (
            <div className="space-y-2">
              <Label htmlFor="share-url">Link Público</Label>
              <div className="flex items-center gap-2">
                <Input id="share-url" value={shareUrl} readOnly className="flex-1" />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleCopyLink}
                  title="Copiar link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleOpenLink}
                  title="Abrir link"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Password protection toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="password-enabled" className="cursor-pointer">
                    Proteger com senha
                  </Label>
                </div>
                <Switch
                  id="password-enabled"
                  checked={passwordEnabled}
                  onCheckedChange={setPasswordEnabled}
                  disabled={isGenerating}
                />
              </div>

              {/* Password input (if enabled) */}
              {passwordEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite uma senha (min. 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isGenerating}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isGenerating}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Alert>
                    <ShieldAlert className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Apenas pessoas com a senha poderão visualizar o deck. Não compartilhe a
                      senha em locais públicos.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {shareUrl ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleRevokeShare}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Revogando...
                  </>
                ) : (
                  "Revogar Compartilhamento"
                )}
              </Button>
              <Button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleGenerateLink}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Link...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Gerar Link Público
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
