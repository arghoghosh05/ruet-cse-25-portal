import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", "out/**", "build/**", "functions/lib/**", "next-env.d.ts"] },
  ...tseslint.configs.recommended,
);
