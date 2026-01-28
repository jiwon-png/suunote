import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // tmp-v0 폴더는 백업용 소스이므로 빌드에서 제외
  // - TypeScript 컴파일 제외: tsconfig.json의 exclude에서 처리됨
  // - Git 추적 제외: .gitignore에서 처리됨
  // - ESLint 제외: eslint.config.mjs에서 처리됨
  // - Next.js 빌드 제외: tsconfig.json의 exclude를 따르므로 자동으로 제외됨
};

export default nextConfig;
