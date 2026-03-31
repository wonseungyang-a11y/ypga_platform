This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3003](http://localhost:3003) with your browser (`npm run dev` uses port 3003).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## GitHub + Vercel 배포

1. **GitHub**에 새 저장소를 만든 뒤 이 프로젝트를 푸시합니다.

   ```bash
   git remote add origin https://github.com/<사용자>/<저장소>.git
   git push -u origin main
   ```

2. **[Vercel](https://vercel.com)** 에 로그인 → **Add New Project** → 방금 저장소를 **Import**합니다.  
   Framework는 Next.js로 자동 감지되며, **Build Command** `next build` / **Output** 기본값을 그대로 두면 됩니다.

3. **Environment Variables** (Settings → Environment Variables)에 다음을 등록합니다.  
   이름은 `.env.example`과 동일합니다.

   | 변수 | 설명 |
   |------|------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon 공개 키 |
   | `SUPABASE_SERVICE_ROLE_KEY` | 서비스 롤 키 (서버 전용, 외부 노출 금지) |
   | `GEMINI_API_KEY` | 데이터 분석(`/api/ask`)용 (없으면 해당 기능만 비활성) |

   배포 후 **Redeploy** 한 번 실행하면 값이 반영됩니다.

4. Supabase **Auth URL** 등에 Vercel 도메인을 추가해야 할 경우, [Supabase Dashboard](https://supabase.com/dashboard)에서 Redirect URLs를 확인하세요.

자세한 Next.js 배포: [Deploying](https://nextjs.org/docs/app/building-your-application/deploying).
