'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, User } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/admin/login');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black mb-8">Configurações</h1>

      <Card className="fun-card border-0">
        <CardHeader>
          <CardTitle>Perfil do Administrador</CardTitle>
          <CardDescription>Informações da sua conta</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white/30 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{user?.displayName || 'Administrador'}</p>
              <p className="text-sm text-text-soft">{user?.email}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20">
            <Button onClick={handleLogout} variant="outline" className="text-error hover:bg-error/10">
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
