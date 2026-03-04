import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">BA Raid Tracker</h1>
          <p className="text-muted-foreground mt-2 text-sm">로그인하여 기록을 관리하세요</p>
        </div>

        <div className="space-y-3">
          <form
            action={async () => {
              'use server';
              await signIn('discord', { redirectTo: '/' });
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Discord로 로그인
            </Button>
          </form>

          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/' });
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Google로 로그인
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
