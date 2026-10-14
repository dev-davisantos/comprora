import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

import { suppliersApi } from '@/api/endpoints/suppliers';
import type { Supplier } from '@/api/types';
import { ApiError } from '@/api/client';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const supplierSchema = z.object({
  displayName: z.string().min(1, 'Nome fantasia é obrigatório'),
  corporateName: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .regex(/^\d{14}$/, 'CNPJ deve conter exatamente 14 dígitos numéricos'),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

// ---------------------------------------------------------------------------
// CNPJ mask helper
// ---------------------------------------------------------------------------

function formatCnpj(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function displayCnpj(cnpj: string): string {
  if (cnpj.length === 14) return formatCnpj(cnpj);
  return cnpj;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Suppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Search state
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);

  // ---- Queries & Mutations ------------------------------------------------

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersApi.list(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast('Fornecedor criado com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError ? err.message : 'Erro ao criar fornecedor',
        'destructive',
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SupplierFormData }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast('Fornecedor atualizado com sucesso');
      closeForm();
    },
    onError: (err) => {
      toast(
        err instanceof ApiError
          ? err.message
          : 'Erro ao atualizar fornecedor',
        'destructive',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast('Fornecedor removido');
      setDeleteTarget(null);
    },
    onError: (err) => {
      toast(
        err instanceof ApiError
          ? err.message
          : 'Erro ao remover fornecedor',
        'destructive',
      );
    },
  });

  // ---- Form ---------------------------------------------------------------

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { displayName: '', corporateName: '', cnpj: '' },
  });

  function openCreate() {
    form.reset({ displayName: '', corporateName: '', cnpj: '' });
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(supplier: Supplier) {
    form.reset({
      displayName: supplier.displayName,
      corporateName: supplier.corporateName,
      cnpj: supplier.cnpj,
    });
    setEditing(supplier);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    form.reset();
  }

  function onSubmit(data: SupplierFormData) {
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ---- Search handler -----------------------------------------------------

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
  }

  // ---- Render -------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fornecedores</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastro e busca de fornecedores.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, razão social ou CNPJ…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchInput('');
              setSearch('');
            }}
          >
            Limpar
          </Button>
        )}
      </form>

      {/* Table */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : suppliers.length === 0 ? (
        <div className="rounded-lg border border-border bg-background p-8 text-center">
          <p className="text-muted-foreground">
            {search
              ? 'Nenhum fornecedor encontrado para a busca.'
              : 'Nenhum fornecedor cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    {s.displayName}
                  </TableCell>
                  <TableCell>{s.corporateName}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {displayCnpj(s.cnpj)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(s)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(s)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => !o && closeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Atualize os dados do fornecedor.'
                : 'Preencha os dados para cadastrar um novo fornecedor.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome Fantasia</Label>
              <Input
                id="displayName"
                {...form.register('displayName')}
                placeholder="Nome fantasia"
              />
              {form.formState.errors.displayName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.displayName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="corporateName">Razão Social</Label>
              <Input
                id="corporateName"
                {...form.register('corporateName')}
                placeholder="Razão social"
              />
              {form.formState.errors.corporateName && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.corporateName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                {...form.register('cnpj')}
                placeholder="00000000000000"
                maxLength={14}
              />
              {form.formState.errors.cnpj && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.cnpj.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Apenas os 14 dígitos, sem pontuação.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando…' : editing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Excluir Fornecedor"
        description={`Tem certeza que deseja excluir "${deleteTarget?.displayName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
