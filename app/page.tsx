"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type Period = "monthly" | "annual";

type Faturamento = {
  id: string;
  cliente: string;
  servico: string;
  valor: number;
  data: string;
};

type Investimento = {
  id: string;
  descricao: string;
  valor: number;
  data: string;
};

const monthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function Home() {
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("monthly");

  const [faturamentos, setFaturamentos] = useState<Faturamento[]>([]);
  const [investimentosList, setInvestimentosList] = useState<Investimento[]>(
    []
  );

  const [showForm, setShowForm] = useState(false);
  const [showInvestmentForm, setShowInvestmentForm] = useState(false);

  const [editingFaturamentoId, setEditingFaturamentoId] = useState<
    string | null
  >(null);

  const [editingInvestimentoId, setEditingInvestimentoId] = useState<
    string | null
  >(null);

  const [cliente, setCliente] = useState("");
  const [servico, setServico] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const [descricaoInvestimento, setDescricaoInvestimento] = useState("");
  const [valorInvestimento, setValorInvestimento] = useState("");
  const [dataInvestimento, setDataInvestimento] = useState("");

  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [savingInvestment, setSavingInvestment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [message, setMessage] = useState("");
  const [investmentMessage, setInvestmentMessage] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();

    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());

    const todayString = today.toISOString().split("T")[0];

    setData(todayString);
    setDataInvestimento(todayString);

    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const [faturamentosResult, investimentosResult] = await Promise.all([
      supabase
        .from("faturamentos")
        .select("id, cliente, servico, valor, data")
        .order("data", { ascending: false }),

      supabase
        .from("investimentos")
        .select("id, descricao, valor, data")
        .order("data", { ascending: false }),
    ]);

    setLoading(false);

    if (faturamentosResult.error) {
      console.error(faturamentosResult.error);
      setMessage("Não foi possível carregar os faturamentos.");
    } else {
      setFaturamentos(faturamentosResult.data ?? []);
    }

    if (investimentosResult.error) {
      console.error(investimentosResult.error);
      setInvestmentMessage("Não foi possível carregar os investimentos.");
    } else {
      setInvestimentosList(investimentosResult.data ?? []);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      setLoggingOut(false);
      return;
    }

    router.push("/login");
  }

  function handleEditFaturamento(item: Faturamento) {
    setEditingFaturamentoId(item.id);

    setCliente(item.cliente);
    setServico(item.servico);
    setValor(String(item.valor));
    setData(item.data);

    setMessage("");

    setShowForm(true);
  }

  function closeFaturamentoForm() {
    setShowForm(false);
    setEditingFaturamentoId(null);
    setMessage("");

    setCliente("");
    setServico("");
    setValor("");

    const today = new Date();
    setData(today.toISOString().split("T")[0]);
  }

  function handleEditInvestimento(item: Investimento) {
    setEditingInvestimentoId(item.id);

    setDescricaoInvestimento(item.descricao);
    setValorInvestimento(String(item.valor));
    setDataInvestimento(item.data);

    setInvestmentMessage("");

    setShowInvestmentForm(true);
  }

  function closeInvestmentForm() {
    setShowInvestmentForm(false);
    setEditingInvestimentoId(null);
    setInvestmentMessage("");

    setDescricaoInvestimento("");
    setValorInvestimento("");

    const today = new Date();
    setDataInvestimento(today.toISOString().split("T")[0]);
  }

  async function handleDeleteFaturamento(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este faturamento?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase
      .from("faturamentos")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (error) {
      console.error(error);
      setMessage("Não foi possível excluir o faturamento.");
      return;
    }

    setFaturamentos((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  async function handleDeleteInvestimento(id: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este investimento?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (error) {
      console.error(error);
      setInvestmentMessage("Não foi possível excluir o investimento.");
      return;
    }

    setInvestimentosList((current) =>
      current.filter((item) => item.id !== id)
    );
  }

  const monthly = useMemo(() => {
    if (currentMonth === null || currentYear === null) {
      return 0;
    }

    return faturamentos
      .filter((item) => {
        const date = new Date(`${item.data}T00:00:00`);

        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((total, item) => total + Number(item.valor), 0);
  }, [faturamentos, currentMonth, currentYear]);

  const annual = useMemo(() => {
    if (currentYear === null) {
      return 0;
    }

    return faturamentos
      .filter((item) => {
        const date = new Date(`${item.data}T00:00:00`);

        return date.getFullYear() === currentYear;
      })
      .reduce((total, item) => total + Number(item.valor), 0);
  }, [faturamentos, currentYear]);

  const monthlyInvestments = useMemo(() => {
    if (currentMonth === null || currentYear === null) {
      return 0;
    }

    return investimentosList
      .filter((item) => {
        const date = new Date(`${item.data}T00:00:00`);

        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((total, item) => total + Number(item.valor), 0);
  }, [investimentosList, currentMonth, currentYear]);

  const annualInvestments = useMemo(() => {
    if (currentYear === null) {
      return 0;
    }

    return investimentosList
      .filter((item) => {
        const date = new Date(`${item.data}T00:00:00`);

        return date.getFullYear() === currentYear;
      })
      .reduce((total, item) => total + Number(item.valor), 0);
  }, [investimentosList, currentYear]);

  const currentValue = period === "monthly" ? monthly : annual;

  const currentInvestments =
    period === "monthly" ? monthlyInvestments : annualInvestments;

  const netValue = currentValue - currentInvestments;

  const chartMonths = useMemo(() => {
    return monthNames.map((name, index) => {
      const value = faturamentos
        .filter((item) => {
          const date = new Date(`${item.data}T00:00:00`);

          return (
            date.getMonth() === index &&
            currentYear !== null &&
            date.getFullYear() === currentYear
          );
        })
        .reduce((total, item) => total + Number(item.valor), 0);

      return {
        name,
        value,
      };
    });
  }, [faturamentos, currentYear]);

  const maxValue = Math.max(
    ...chartMonths.map((month) => month.value),
    1
  );

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`);

    return date.toLocaleDateString("pt-BR");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const numericValue = Number(valor.replace(",", "."));

    if (
      !cliente.trim() ||
      !servico.trim() ||
      !numericValue ||
      numericValue <= 0
    ) {
      setMessage("Preencha cliente, serviço e um valor válido.");
      return;
    }

    setSaving(true);

    let error;

    if (editingFaturamentoId) {
      const result = await supabase
        .from("faturamentos")
        .update({
          cliente: cliente.trim(),
          servico: servico.trim(),
          valor: numericValue,
          data,
        })
        .eq("id", editingFaturamentoId);

      error = result.error;
    } else {
      const result = await supabase.from("faturamentos").insert({
        cliente: cliente.trim(),
        servico: servico.trim(),
        valor: numericValue,
        data,
      });

      error = result.error;
    }

    setSaving(false);

    if (error) {
      console.error(error);
      setMessage(
        editingFaturamentoId
          ? "Não foi possível atualizar o faturamento."
          : "Não foi possível salvar o faturamento."
      );
      return;
    }

    const wasEditing = Boolean(editingFaturamentoId);

    setCliente("");
    setServico("");
    setValor("");

    const today = new Date();

    setData(today.toISOString().split("T")[0]);

    setEditingFaturamentoId(null);

    setMessage(
      wasEditing
        ? "Faturamento atualizado com sucesso."
        : "Faturamento registrado com sucesso."
    );

    await loadData();
  }

  async function handleInvestmentSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setInvestmentMessage("");

    const numericValue = Number(valorInvestimento.replace(",", "."));

    if (
      !descricaoInvestimento.trim() ||
      !numericValue ||
      numericValue <= 0
    ) {
      setInvestmentMessage("Preencha a descrição e um valor válido.");
      return;
    }

    setSavingInvestment(true);

    let error;

    if (editingInvestimentoId) {
      const result = await supabase
        .from("investimentos")
        .update({
          descricao: descricaoInvestimento.trim(),
          valor: numericValue,
          data: dataInvestimento,
        })
        .eq("id", editingInvestimentoId);

      error = result.error;
    } else {
      const result = await supabase.from("investimentos").insert({
        descricao: descricaoInvestimento.trim(),
        valor: numericValue,
        data: dataInvestimento,
      });

      error = result.error;
    }

    setSavingInvestment(false);

    if (error) {
      console.error(error);
      setInvestmentMessage(
        editingInvestimentoId
          ? "Não foi possível atualizar o investimento."
          : "Não foi possível salvar o investimento."
      );
      return;
    }

    const wasEditing = Boolean(editingInvestimentoId);

    setDescricaoInvestimento("");
    setValorInvestimento("");

    const today = new Date();

    setDataInvestimento(today.toISOString().split("T")[0]);

    setEditingInvestimentoId(null);

    setInvestmentMessage(
      wasEditing
        ? "Investimento atualizado com sucesso."
        : "Investimento registrado com sucesso."
    );

    await loadData();
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-[1380px] px-5 py-8 sm:px-7 sm:py-10 lg:px-10">
        <header className="mb-10 flex flex-col gap-7 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045]">
                <div className="h-2 w-2 rounded-full bg-white" />
                <div className="absolute inset-0 rounded-xl border border-white/[0.04]" />
              </div>

              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-white/35">
                Agency Finance
              </p>
            </div>

            <h1 className="mt-5 text-[32px] font-semibold tracking-[-0.045em] sm:text-[40px]">
              Visão financeira
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
              Uma visão clara do faturamento, investimentos e resultado da
              agência.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-white/10 bg-white/[0.025] p-1 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
              <button
                type="button"
                onClick={() => setPeriod("monthly")}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  period === "monthly"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Mensal
              </button>

              <button
                type="button"
                onClick={() => setPeriod("annual")}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  period === "annual"
                    ? "bg-white text-black"
                    : "text-white/40 hover:text-white"
                }`}
              >
                Anual
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-white/40 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b] p-6 transition duration-300 hover:border-white/[0.16] sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/[0.025] blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                  Faturamento
                </p>

                <p className="mt-1 text-sm text-white/45">
                  {period === "monthly" ? "Este mês" : "Este ano"}
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-white/30">
                Bruto
              </span>
            </div>

            <div className="relative mt-8">
              <p className="text-[34px] font-semibold tracking-[-0.055em] sm:text-[40px]">
                {loading ? "..." : formatMoney(currentValue)}
              </p>

              <p className="mt-2 text-xs text-white/25">
                Período de {currentYear ?? ""}
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0b0b] p-6 transition duration-300 hover:border-white/[0.16] sm:p-7">
            <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/[0.02] blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">
                  Investimentos
                </p>

                <p className="mt-1 text-sm text-white/45">
                  {period === "monthly" ? "Neste mês" : "Neste ano"}
                </p>
              </div>

              <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-white/30">
                Capital
              </span>
            </div>

            <div className="relative mt-8">
              <p className="text-[34px] font-semibold tracking-[-0.055em] sm:text-[40px]">
                {loading ? "..." : formatMoney(currentInvestments)}
              </p>

              <p className="mt-2 text-xs text-white/25">
                Total aplicado no período
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.075] p-6 transition duration-300 hover:border-white/20 hover:bg-white/[0.09] sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/[0.05] blur-3xl" />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/55">
                  Resultado
                </p>

                <p className="mt-1 text-sm text-white/45">
                  Líquido do período
                </p>
              </div>

              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-black">
                Líquido
              </span>
            </div>

            <div className="relative mt-8">
              <p
                className={`text-[34px] font-semibold tracking-[-0.055em] sm:text-[40px] ${
                  netValue < 0 ? "text-red-400" : "text-white"
                }`}
              >
                {loading ? "..." : formatMoney(netValue)}
              </p>

              <p className="mt-2 text-xs text-white/35">
                Bruto menos investimentos
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] p-5 sm:p-7">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/25">
                Desempenho anual
              </p>

              <h2 className="mt-2 text-xl font-medium tracking-[-0.02em]">
                Faturamento por mês
              </h2>
            </div>

            <div className="rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs text-white/30">
              {currentYear ?? ""}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 flex h-[250px] flex-col justify-between">
              <div className="border-t border-white/[0.045]" />
              <div className="border-t border-white/[0.045]" />
              <div className="border-t border-white/[0.045]" />
              <div className="border-t border-white/[0.045]" />
            </div>

            <div className="relative flex h-[270px] items-end gap-2 overflow-x-auto pb-1 sm:gap-3">
              {chartMonths.map((month, index) => {
                const height =
                  month.value === 0
                    ? 2
                    : Math.max((month.value / maxValue) * 100, 5);

                const isCurrentMonth = index === currentMonth;

                return (
                  <div
                    key={month.name}
                    className="group flex h-full min-w-[40px] flex-1 flex-col justify-end sm:min-w-[48px]"
                  >
                    <div className="relative flex h-[250px] items-end">
                      {month.value > 0 && (
                        <div className="absolute bottom-full left-1/2 mb-3 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-[#151515] px-3 py-2 text-[11px] font-medium text-white/75 shadow-2xl group-hover:block">
                          {formatMoney(month.value)}
                        </div>
                      )}

                      <div
                        className={`relative w-full overflow-hidden rounded-t-[10px] transition-all duration-500 ${
                          isCurrentMonth
                            ? "bg-white"
                            : month.value > 0
                              ? "bg-white/[0.13] group-hover:bg-white/[0.23]"
                              : "bg-white/[0.055]"
                        }`}
                        style={{
                          height: `${height}%`,
                        }}
                      >
                        {month.value > 0 && (
                          <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
                        )}
                      </div>
                    </div>

                    <span
                      className={`mt-3 text-center text-[11px] ${
                        isCurrentMonth
                          ? "font-medium text-white"
                          : "text-white/25"
                      }`}
                    >
                      {month.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              closeFaturamentoForm();
              setShowForm(true);
            }}
            className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] p-6 text-left transition duration-300 hover:border-white/20 hover:bg-white/[0.045] sm:p-7"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/[0.025] blur-3xl transition group-hover:bg-white/[0.05]" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
                  Receita
                </p>

                <p className="mt-3 text-lg font-medium tracking-tight">
                  Adicionar faturamento
                </p>

                <p className="mt-1 text-sm text-white/30">
                  Registre uma nova entrada.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-xl text-white/45 transition duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black">
                +
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              closeInvestmentForm();
              setShowInvestmentForm(true);
            }}
            className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-[#0a0a0a] p-6 text-left transition duration-300 hover:border-white/20 hover:bg-white/[0.045] sm:p-7"
          >
            <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/[0.025] blur-3xl transition group-hover:bg-white/[0.05]" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
                  Capital
                </p>

                <p className="mt-3 text-lg font-medium tracking-tight">
                  Adicionar investimento
                </p>

                <p className="mt-1 text-sm text-white/30">
                  Registre uma nova aplicação.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-xl text-white/45 transition duration-300 group-hover:border-white group-hover:bg-white group-hover:text-black">
                +
              </div>
            </div>
          </button>
        </section>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-[#0a0a0a] p-5 sm:p-7">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
                Registros
              </p>

              <h2 className="mt-2 text-xl font-medium tracking-[-0.02em]">
                Faturamentos
              </h2>
            </div>

            <span className="text-xs text-white/20">
              {faturamentos.length}{" "}
              {faturamentos.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {faturamentos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm text-white/30">
                Nenhum faturamento registrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-[1.2fr_1.5fr_1fr_110px_150px] gap-4 border-b border-white/10 px-4 pb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
                  <span>Cliente</span>
                  <span>Serviço</span>
                  <span>Valor</span>
                  <span>Data</span>
                  <span />
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {faturamentos.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.2fr_1.5fr_1fr_110px_150px] items-center gap-4 px-4 py-4 transition hover:bg-white/[0.02]"
                    >
                      <p className="truncate text-sm font-medium text-white/80">
                        {item.cliente}
                      </p>

                      <p className="truncate text-sm text-white/40">
                        {item.servico}
                      </p>

                      <p className="text-sm font-medium text-white/70">
                        {formatMoney(Number(item.valor))}
                      </p>

                      <p className="text-xs text-white/30">
                        {formatDate(item.data)}
                      </p>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditFaturamento(item)}
                          disabled={deletingId === item.id}
                          className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-medium text-white/35 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFaturamento(item.id)}
                          disabled={deletingId === item.id}
                          aria-label="Excluir faturamento"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg text-white/20 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item.id ? "..." : "×"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-[#0a0a0a] p-5 sm:p-7">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/25">
                Registros
              </p>

              <h2 className="mt-2 text-xl font-medium tracking-[-0.02em]">
                Investimentos
              </h2>
            </div>

            <span className="text-xs text-white/20">
              {investimentosList.length}{" "}
              {investimentosList.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          {investimentosList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm text-white/30">
                Nenhum investimento registrado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[680px]">
                <div className="grid grid-cols-[1.6fr_1fr_130px_150px] gap-4 border-b border-white/10 px-4 pb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-white/20">
                  <span>Descrição</span>
                  <span>Valor</span>
                  <span>Data</span>
                  <span />
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {investimentosList.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.6fr_1fr_130px_150px] items-center gap-4 px-4 py-4 transition hover:bg-white/[0.02]"
                    >
                      <p className="truncate text-sm font-medium text-white/75">
                        {item.descricao}
                      </p>

                      <p className="text-sm font-medium text-white/70">
                        {formatMoney(Number(item.valor))}
                      </p>

                      <p className="text-xs text-white/30">
                        {formatDate(item.data)}
                      </p>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditInvestimento(item)}
                          disabled={deletingId === item.id}
                          className="rounded-xl border border-white/10 px-3 py-2 text-[11px] font-medium text-white/35 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteInvestimento(item.id)}
                          disabled={deletingId === item.id}
                          aria-label="Excluir investimento"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-lg text-white/20 transition hover:bg-red-500/10 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === item.id ? "..." : "×"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101010] p-6 shadow-2xl sm:p-7">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
                    {editingFaturamentoId
                      ? "Editar registro"
                      : "Novo registro"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {editingFaturamentoId
                      ? "Editar faturamento"
                      : "Adicionar faturamento"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeFaturamentoForm}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/45">
                    Cliente
                  </label>

                  <input
                    value={cliente}
                    onChange={(event) => setCliente(event.target.value)}
                    placeholder="Ex: Nike"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.05]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/45">
                    Serviço
                  </label>

                  <input
                    value={servico}
                    onChange={(event) => setServico(event.target.value)}
                    placeholder="Ex: Criação de site"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.05]"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/45">
                      Valor
                    </label>

                    <input
                      value={valor}
                      onChange={(event) => setValor(event.target.value)}
                      placeholder="1000"
                      inputMode="decimal"
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.05]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/45">
                      Data
                    </label>

                    <input
                      type="date"
                      value={data}
                      onChange={(event) => setData(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.05]"
                    />
                  </div>
                </div>

                {message && (
                  <p className="text-sm text-white/55">{message}</p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? editingFaturamentoId
                      ? "Atualizando..."
                      : "Salvando..."
                    : editingFaturamentoId
                      ? "Atualizar faturamento"
                      : "Salvar faturamento"}
                </button>
              </form>
            </div>
          </div>
        )}

        {showInvestmentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-md">
            <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101010] p-6 shadow-2xl sm:p-7">
              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/25">
                    {editingInvestimentoId
                      ? "Editar registro"
                      : "Novo registro"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {editingInvestimentoId
                      ? "Editar investimento"
                      : "Adicionar investimento"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeInvestmentForm}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={handleInvestmentSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-medium text-white/45">
                    Descrição
                  </label>

                  <input
                    value={descricaoInvestimento}
                    onChange={(event) =>
                      setDescricaoInvestimento(event.target.value)
                    }
                    placeholder="Ex: Tráfego pago"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.05]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/45">
                    Valor
                  </label>

                  <input
                    value={valorInvestimento}
                    onChange={(event) =>
                      setValorInvestimento(event.target.value)
                    }
                    placeholder="1000"
                    inputMode="decimal"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/25 focus:bg-white/[0.05]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-white/45">
                    Data
                  </label>

                  <input
                    type="date"
                    value={dataInvestimento}
                    onChange={(event) =>
                      setDataInvestimento(event.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition focus:border-white/25 focus:bg-white/[0.05]"
                  />
                </div>

                {investmentMessage && (
                  <p className="text-sm text-white/55">
                    {investmentMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={savingInvestment}
                  className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingInvestment
                    ? editingInvestimentoId
                      ? "Atualizando..."
                      : "Salvando..."
                    : editingInvestimentoId
                      ? "Atualizar investimento"
                      : "Salvar investimento"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}