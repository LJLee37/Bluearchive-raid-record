import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-lg border p-8 text-center">
        <h1 className="text-2xl font-bold">인증 오류</h1>
        <p className="text-muted-foreground text-sm">로그인 중 문제가 발생했습니다.</p>
        <Button asChild variant="outline">
          <Link href="/auth/signin">다시 시도</Link>
        </Button>
      </div>
    </div>
  );
}
