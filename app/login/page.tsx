"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    console.log("1 - tentando login");

    const result = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    console.log("2 - resposta do Supabase:", result);

    if (result.error) {
      setErro(result.error.message);
      setCarregando(false);
      return;
    }

    console.log("3 - login realizado");

    router.push("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-6"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">
            Agency Finance
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Entrar
          </h1>

          <p className="mt-2 text-sm text-white/40">
            Acesse seu painel financeiro.
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/[0.07]"
          />
        </div>

        {erro && (
          <p className="text-sm text-red-400">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-2xl bg-white px-4 py-3 font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}