import Link from "next/link";
import { MessageCircle, ShieldCheck, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      <Button
        onClick={() => toast.success("Hello Jani")}
      >
        Test Toast
      </Button>
      <header className="border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] text-white">
              <MessageCircle className="h-5 w-5" />
            </div>
            <span className="text-xl font-semibold text-[#0F172A]">
              ChatConnect
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#2563EB] hover:bg-[#1D4ED8]">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-[#E2E8F0] bg-white px-4 py-2 text-sm text-[#64748B]">
            Fast and secure realtime chat
          </p>

          <h1 className="max-w-xl text-5xl font-semibold leading-tight text-[#0F172A] md:text-6xl">
            Stay connected with simple realtime messaging.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-[#64748B]">
            A clean chat application for quick conversations, user search and
            instant message delivery across devices.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button className="h-12 rounded-xl bg-[#2563EB] px-6 hover:bg-[#1D4ED8]">
                Create account
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="h-12 rounded-xl border-[#E2E8F0] px-6"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <div className="mb-4 flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[#DBEAFE]" />
                <div>
                  <div className="h-3 w-28 rounded bg-[#CBD5E1]" />
                  <div className="mt-2 h-2 w-16 rounded bg-[#E2E8F0]" />
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            </div>

            <div className="space-y-4">
              <div className="max-w-[75%] rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A]">
                Hey, are you available?
              </div>

              <div className="ml-auto max-w-[75%] rounded-2xl bg-[#2563EB] px-4 py-3 text-sm text-white">
                Yes, I’m here. Send me the details.
              </div>

              <div className="max-w-[70%] rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A]">
                Great, checking it now.
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-3">
              <div className="h-3 flex-1 rounded bg-[#E2E8F0]" />
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-white">
                <MessageCircle className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: "Realtime messages",
              text: "Messages appear instantly using WebSocket powered realtime updates.",
            },
            {
              icon: ShieldCheck,
              title: "Secure login",
              text: "Authentication keeps every conversation connected to real users.",
            },
            {
              icon: Search,
              title: "Find users fast",
              text: "Search people and start a conversation with a clean interface.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF1FF] text-[#2563EB]">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}