import { Settings } from "@/lib/magic";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
}

export function SettingsPanel({ open, onOpenChange, settings, setSettings }: Props) {
  const update = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setSettings({ ...settings, [k]: v });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Backstage</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Skin</Label>
            <Select value={settings.skin} onValueChange={(v) => update("skin", v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Formato T</Label>
            <Select value={String(settings.format)} onValueChange={(v) => update("format", Number(v) as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8 (HHMMSSCC)</SelectItem>
                <SelectItem value="12">12 (DDMMYYYYHHMM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Modo Predicción</Label>
            <Switch
              checked={settings.predictionOn}
              onCheckedChange={(v) => update("predictionOn", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Valor P</Label>
            <Input
              type="number"
              className="w-32"
              value={settings.predictionValue}
              onChange={(e) => update("predictionValue", Number(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Offset minutos</Label>
            <Select value={String(settings.minutesOffset)} onValueChange={(v) => update("minutesOffset", Number(v) as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">+0</SelectItem>
                <SelectItem value="1">+1</SelectItem>
                <SelectItem value="2">+2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Sensibilidad inyección</Label>
            <Input
              type="number"
              min={1}
              max={10}
              className="w-32"
              value={settings.injectionSensitivity}
              onChange={(e) => update("injectionSensitivity", Math.max(1, Number(e.target.value) || 3))}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Long-press (ms)</Label>
            <Input
              type="number"
              min={300}
              max={3000}
              step={100}
              className="w-32"
              value={settings.longPressMs}
              onChange={(e) => update("longPressMs", Math.max(300, Number(e.target.value) || 1000))}
            />
          </div>

          <Button className="w-full" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
