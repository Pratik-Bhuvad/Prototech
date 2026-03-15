import Link from "next/link"
import './Landing.css'

export default function LandingPage() {
  return (
    <div className="bg-grid w-screen h-[calc(100vh-56px)] flex items-center justify-center">
      <section className="px-6 max-w-6xl mx-auto text-center">

        <h1 className="fade-up delay-1 text-5xl font-bold tracking-tight">
          Proto<span className="text-purple-700">Tech</span>
        </h1>
        <p className="my-2 font-medium text-sm text-black/70 tracking-wide">Evaluation Platform</p>


        <div className="fade-up delay-4 flex flex-wrap items-center justify-center gap-3 mt-10">
          <Link href="/judge" className="btn-ghost rounded-md text-purple-700">Judge Login</Link>
          <Link href="/admin" className="btn-primary rounded-md">Admin Portal</Link>
        </div>

        {/* dots */}
        <div className="fade-up delay-5 dot-row mt-14">
          <span /><span /><span /><span /><span />
        </div>
      </section>

    </div>
  )
}