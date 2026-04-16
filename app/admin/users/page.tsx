'use client';

import { useEffect, useState } from 'react';
import { Search, X, Shield, User, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.displayName?.toLowerCase().includes(lower) ||
            u.email?.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, users]);

  async function loadUsers() {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserProfile[];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: 'user' | 'admin' | 'editor') {
    setUpdatingRole(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.uid === userId ? { ...u, role: newRole } : u))
      );
    } catch (error) {
      console.error('Erro ao atualizar função:', error);
      alert('Não foi possível alterar a função do usuário.');
    } finally {
      setUpdatingRole(null);
    }
  }

  async function handleDeleteUser(user: UserProfile) {
    try {
      // Excluir documento do Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      // Opcional: também excluir do Authentication (requer Cloud Function ou Admin SDK)
      setUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      setUserToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Não foi possível excluir o usuário.');
    }
  }

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>;
      case 'editor':
        return <Badge className="bg-secondary/20 text-secondary border-secondary/30">Editor</Badge>;
      default:
        return <Badge className="bg-text-soft/20 text-text-soft">Usuário</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black">Usuários</h1>
        <Badge className="tag-badge text-sm py-2 px-4">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'usuário' : 'usuários'}
        </Badge>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 pr-10 fun-card border-0 bg-white/70"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/5"
          >
            <X className="w-4 h-4 text-text-soft" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="fun-card border-0 overflow-hidden">
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Favoritos</TableHead>
                  <TableHead>Data de cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr
                      key={user.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-white/20"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.photoURL} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.displayName || 'Sem nome'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-soft">{user.email}</TableCell>
                      <TableCell>
                        {updatingRole === user.uid ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Select
                            defaultValue={user.role || 'user'}
                            onValueChange={(val: 'user' | 'admin' | 'editor') => handleRoleChange(user.uid, val)}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>{user.favorites?.length || 0} lugares</TableCell>
                      <TableCell className="text-sm text-text-soft">
                        {user.createdAt
                          ? format(
                              user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt),
                              "dd/MM/yyyy",
                              { locale: ptBR }
                            )
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setUserToDelete(user)}
                              className="text-error focus:text-error"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      )}

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir permanentemente o usuário{' '}
              <strong>{userToDelete?.displayName || userToDelete?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-error hover:bg-error/90"
            >
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
        }
